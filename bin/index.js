#!/usr/bin/env node

"use strict"

const cli = require('yargs')
.usage('Find, filter & format package data in node_modules.\n\nUsage: $0 [options] [name[@version] ...]')
.boolean('a')
.alias('a', 'all')
.describe('a', 'Match all dependencies. non-zero exit if not all match.')
.default('d', 0)
.describe('d', 'Traversal depth. use --depth=Infinity or --depth=-1 to traverse entire dependency tree.')
.alias('d', 'depth')
.string('f')
.describe('f', 'Output format string. Place variables in {curlies}.')
.default('f', '{name}@{version}')
.alias('f', 'format')
.boolean('t')
.describe('t', 'Show output in a table. Use --format to indicate desired columns. All non-variables are ignored.')
.alias('t', 'table')
.boolean('s')
.describe('s', 'Only list packages which contain all variables in --format.')
.alias('s', 'strict')
.string('x')
.describe('x', 'Filter packages using an arbitrary ES6 expression. No return statement required. Use at own risk.')
.alias('x', 'filter')
.boolean('dev')
.describe('dev', 'Include development dependencies.')
.boolean('extraneous')
.default('extraneous', true)
.describe('extraneous', 'Show extraneous dependencies')
.describe('no-extraneous', 'Filter extraneous dependencies. This will include --dev dependencies if --dev is not enabled.')
.boolean('flatten')
.describe('flatten', 'Flatten --json output so there is no object nesting.')
.boolean('json')
.describe('json', 'Generate JSON output. Respects keys used in --format. All non-variables are ignored.')
.boolean('list-vars')
.describe('list-vars', 'List examples of possible --format & --table variables.')
.boolean('summary')
.default('summary', true)
.describe('summary', 'Show summary after results on stderr.')
.describe('no-summary', 'Do not print any summary text to stderr. "e.g. 5 matching dependencies."')
.describe('silent', 'No visual output, exit codes only.')
.boolean('unique')
.default('unique', true)
.describe('unique', 'Only display unique lines of output.')
.describe('no-unique', 'Do not remove duplicate lines of output.')
.example('$0', 'List all top-level dependencies')
//.example('$0 mkdirp', 'Check whether any version of mkdirp is installed at the top level.')
.example('$0 inherits mkdirp', 'Check whether either mkdirp or inherits are installed. Only fails if none can be found.')
.example('$0 --all inherits mkdirp', 'Check whether both mkdirp and inherits are installed. Fails all dependencies are found.')
//.example('$0 --depth=-1', 'List all dependencies at any depth.')
.example('$0 --depth=-1 mkdirp', 'Check whether mkdirp is installed at any depth.')
//.example('$0 --dev', 'List all top-level dependencies, including devDependencies.')
.example('$0 --dev mkdirp', 'Check for mkdirp as a dependency OR a devDependency. devDependencies are filtered-out by default.')
//.example('$0 mkdirp@1.3.2', 'Check whether specifically mkdirp@1.3.2 is installed.')
.example('$0 mkdirp@^1.0.0', 'Check whether mkdirp version matching ^1.0.0 is installed.')
//.example('$0 --no-extraneous', 'List all packages, ignoring extraneous dependencies.')
//.example('$0 --table', 'Format top level dependencies name & version as a table.')
.example('$0 --format="{name}" mkdirp inherits', 'Only print names of matching installed dependencies at the top level.')
.example('$0 --format="{version} - {realPath}" mkdirp', 'Print the version followed by a hyphen and the realpath to mkdirp.')
.example('$0 --table --format="{name} {license} {path}"', 'Format top level dependency name, license and path as a table.')
.example('$0 --depth=-1 --unique --format="{name}@{version}"', 'List all dependencies, but only display unique name@version instances.')
.example('$0 --filter="scripts.test"', 'List only dependencies with a test script.')
.example('$0 --filter="dependencies.browserify"', 'List only dependencies that depend on browserify.')
.example('$0 --filter="browserify.transform.includes(\'es6ify\')"', 'List only dependencies with es6ify as a browserify transform (Note: ES6 prototype features are shimmed).')
.example('$0 --filter="dependencies.browserify" --dev', 'List only dependencies that depend on browserify.')
.help('help')
.version(require('../package.json').version, 'version')

const argv = cli.argv

const matchInstalled = require('../')
const template = require('hogan')
const columnify = require('columnify')
const split = require('split-object')
const flat = require('flat')
const stringify = require('json-stringify-safe')
const he = require('he')
const addWith = require('with')

const vm = require('vm');
const to5 = require('6to5-core')

// Warning: mutates global prototypes.
require('6to5-core/polyfill')

const dirname = process.cwd()
const toMatch = argv._

let exitCode = 0

argv.columns = {
  truncate: true,
  maxLineWidth: 'auto'
}

// Note I've used the square bracket syntax for all argv accesses so
// that it's easier to see where the args are used.

if (argv['depth'] === 'Infinity') argv['depth'] = Infinity
if (argv['depth'] === -1) argv['depth'] = Infinity
if (argv['list-vars']) {
  logStdErr('Possible format keys:')
  possibleFormatKeys(dirname, argv)
  return
}


matchInstalled(dirname, toMatch, argv, function(err, pkgs, matched) {
  if (err) throw err
  enableObjectKeysOnToString()
  matched = matched || []
  pkgs = pkgs || []
  if (argv['strict'] && argv['format']) {
    pkgs = filterByFormat(pkgs, argv['format'])
  }
  if (argv['filter']) {
    try {
    var filterFn = to5.transform(`
      // whitespace is to reduce noise if there's an error.
      let fn


      =()=> ${argv.filter}



      return fn(pkg, index, pkgs)
    `).code
    } catch(e) {
      throw new Error(`Error in --filter: \n ${e.message}`)
    }
    filterFn = addWith('pkg', filterFn)
    let code = to5.transform(`
      require('6to5-core/register')()
      ;(function() {
        o.pkgs = o.pkgs.filter((pkg, index, pkgs) => {
          try {
            ${filterFn}
          } catch (e) {
            // Ignore type errors e.g. ignore failed a.b.c chains.
            if (e instanceof TypeError) return false
            throw e
          }
        })
      })()
    `)
    var results = {pkgs}
    vm.runInNewContext(code.code, {o: results, require, console: console})
    pkgs = results.pkgs
  }

  let resultTotal = pkgs.length

  if (argv['json']) {
    if (argv['format']) {
      let outData = formatObject(pkgs, argv['format'])

      if (!argv['flatten']) {
        outData = outData.map(data => flat.unflatten(data, {safe: true, object: true}))
      }

      if (argv['table']) outData = split(outData)

      log(stringify(outData, null, 2))

    } else {
      let outData = pkgs
      if (argv['flatten']) outData = flat(outData)
      log(stringify(outData, null, 2))
    }
  } else {
    let outputText = argv['table']
    ? renderTable(pkgs, argv)
    : renderText(pkgs, argv)
    outputText = outputText

    let lines = outputText.split('\n')
    // remove empty lines
    lines = lines.map(l => l.trim()).filter(Boolean)

    if (argv['unique']) {
      let uniqueLines = lines.filter((line, index, arr) => arr.lastIndexOf(line) === index)
      resultTotal = resultTotal - (lines.length - uniqueLines.length)
      lines = uniqueLines
    }
    log(lines.join('\n'))
  }

  let matchingWord = argv._.length ? 'matching ' : ''

  switch (resultTotal)  {
    case 0:
      summary('No %sdependencies!', matchingWord)
      exitCode = 1
      break
    case 1:
      summary('%d %sdependency', resultTotal, matchingWord)
      break
    default:
      summary('%d %sdependencies.', resultTotal, matchingWord)
      break
  }

  if (argv['all']) {
    summary('%d out of %d matches.', matched.length, toMatch.length)
    if (toMatch.length !== matched.length) exitCode = 2
  }

  disableObjectKeysOnToString()
  return process.exit(exitCode)
})


/**
 *
 *   Helpers
 *
 */

const delimiters = '{ }'

function renderText(pkgs, options) {
  return pkgs
  .map(pkg => template.compile(options.format, {delimiters}).render(pkg))
  .join('\n')
}

function filterByFormat(pkgs, format) {
  let vars = getVars(pkgs, format)
  // filter out packages which don't have results for *all* format vars
  return pkgs.filter(pkg => vars.every(v => v.value.render(pkg) !== ''))
}


function formatObject(pkgs, format) {
  let vars = getVars(pkgs, format)
  var obj = pkgs.map(pkg => vars.reduce((obj, v) => {
    obj[v.key] = he.decode(v.value.render(pkg))
    return obj
  }, {}))
  return obj
}

function getVars(pkgs, format) {
  let VARIABLE_TAG = '_v'
  let templateOpts = {delimiters}
  let tree = template.parse(template.scan(format, templateOpts.delimiters))

  let names = tree
  .filter(item => item.tag === VARIABLE_TAG)
  .reduce((names, item, index, arr) => {
    let prev = names[names.length - 1]
    if (!prev) item.i = getLength(item)
    else item.i = prev.i + getLength(item)
    names.push(item)
    return names
  }, [])

  return names.map(item => {
    return {
      key: item.n,
      value: template.generate([item], '', templateOpts)
    }
  })
}

const ObjectToString = Object.prototype.toString

function isPlainObj(o) {
  return o && typeof o === 'object' && o.constructor == Object;
}

function enableObjectKeysOnToString() {
  Object.prototype.toString = function InstalledObjectToString(...args) {
    if (!isPlainObj(this)) return ObjectToString.apply(this, ...args)
    return `${Object.getOwnPropertyNames(this).join(',')}`
  }
}

function disableObjectKeysOnToString() {
  Object.prototype.toString = ObjectToString
}

function possibleFormatKeys(dirname, options) {
  matchInstalled(dirname, [], options, (err, installed) => {
    if (err) throw err
    let data = JSON.parse(stringify(installed[0].parent))
    data.dependencies = {}
    data.devDependencies = {}
    data.parent = {}
    data.readme = data.readme.slice(0, 30) + '...'
    log(columnify(split(flat(data)), options.columns))
    process.exit(0)
  })
}

function renderTable(pkgs, options) {
  return columnify(formatObject(pkgs, options.format), options.columns)
}

function getLength(item) {
  return item.n.length + item.otag.length + item.ctag.length
}

function logStdErr(...args) {
  if (argv['silent']) return
  console.error(...args)
}

function log(...args) {
  if (argv['silent']) return
  console.log(...args)
}

function summary(...args) {
  if (!argv['summary']) return
  logStdErr(...args)
}
