#!/usr/bin/env node

"use strict"

const cli = require('yargs')
.usage('Display data about installed packages.\n\nUsage: $0 [options] [name[@version] ...]')
.boolean('dev')
.describe('dev', 'Include development dependencies.')
.boolean('extraneous')
.default('extraneous', true)
.describe('extraneous', 'Show extraneous dependencies')
.describe('no-extraneous', 'Filter extraneous dependencies. This will include --dev dependencies if --dev is not enabled.')
.boolean('summary')
.default('summary', true)
.describe('summary', 'Show summary after results on stderr.')
.describe('no-summary', 'Do not print any summary text to stderr. "e.g. 5 matching dependencies."')
.describe('depth', 'Traversal depth. use --depth=Infinity or --depth=-1 to traverse entire dependency tree.')
.default('depth', 0)
.alias('d', 'depth')
.boolean('all')
.alias('a', 'all')
.describe('all', 'Match all dependencies. non-zero exit if not all match.')
.alias('s', 'silent')
.describe('silent', 'No visual output, exit codes only.')
.string('format')
.describe('format', 'Output format string. Place variables in {curlies}.')
.default('format', '{name}@{version}')
.boolean('list-vars')
.describe('list-vars', 'List examples of possible --format & --table variables.')
.boolean('table')
.describe('table', 'Show output in a table. Use --format to indicate desired columns. All non-variables are ignored.')
.boolean('unique')
.default('unique', true)
.describe('unique', 'Only display unique lines of output.')
.describe('no-unique', 'Permit duplicate lines of output.')
.string('filter')
.describe('filter', 'Filter packages by an expression. See http://npm.im/to-function for syntax.')
.boolean('strict')
.describe('strict', 'Only list packages which contain all variables in --format.')
.boolean('json')
.describe('json', 'Generate JSON output. Respects keys used in --format. All non-variables are ignored.')
.boolean('flatten')
.describe('flatten', 'Flatten --json output so there is no object nesting.')
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
.example('$0 --filter="browserify.transform.indexOf(\'es6ify\') == -1"', 'List only dependencies with es6ify as a browserify transform.')
.example('$0 --filter="dependencies.browserify" --dev', 'List only dependencies that depend on browserify.')
.help('help')
.version(require('../package.json').version, 'version')

const argv = cli.argv

const matchInstalled = require('../')

const template = require('hogan')
const columnify = require('columnify')
const split = require('split-object')
const flat = require('flat')
const toFunction = require('to-function')
const stringToRegexp = require('string-to-regexp')
const stringify = require('json-stringify-safe')
const he = require('he')

const dirname = process.cwd()
const toMatch = argv._

let exitCode = 0

// Note I've used the square bracket syntax for all argv accesses so
// that it's easier to see where the args are used.

if (argv['depth'] === 'Infinity') argv['depth'] = Infinity
if (argv['depth'] === -1) argv['depth'] = Infinity

if (argv['list-vars']) {
  logStdErr('Possible format keys:')
  possibleFormatKeys(dirname)
  return
}

argv.columns = {
  truncate: true,
  maxLineWidth: 'auto'
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
    if (argv['filter'][0] === '/') {
      argv['filter'] = stringToRegexp(argv['filter'])
    }

    let filter = toFunction(argv['filter'])
    pkgs = pkgs.filter(pkg => {
      try {
        return filter(pkg)
      } catch (e) {
        return false
      }
    })
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
  return typeof o == 'object' && o.constructor == Object;
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
  matchInstalled.readInstalled(dirname, options, (err, installed) => {
    if (err) throw err
    installed.dependencies = installed._dependencies
    delete installed._dependencies
    log(columnify(split(flat(installed)), options.columns))
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
