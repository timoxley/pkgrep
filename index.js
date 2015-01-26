"use strict"

const {join} = require('path')
const readInstalled = require('read-installed')
const semver = require('semver')

const DEFAULT_OPTIONS = Object.freeze({
  dev: false,
  depth: 0,
  extraneous: true
})

function matchInstalled(dirname, matches = [], options = DEFAULT_OPTIONS, fn) {
  matches = matches.map(input => {
    let [name, semver = '*'] = input.split('@')
    return {name, semver}
  })
  read(dirname, options, (err, deps) => {
    if (err) return fn(err)
    // when no supplied versions to match, print everything.
    if (!matches.length) return fn(null, deps)
    let matchedMatches = {}
    deps = deps.filter(dep => matches.some(match => {
      if (
        (match.name === dep.name || match.name === dep.realName) &&
        semver.satisfies(dep.version, match.semver)
      ) {
        let matchKey = `${match.name}@${match.semver}`
        return matchedMatches[matchKey] = true
      } else {
        return false
      }
    }))
    fn(null, deps, Object.keys(matchedMatches))
  })
}

function read(dirname, options = DEFAULT_OPTIONS, fn) {
  readInstalled(dirname, options, (err, installed) => {
    if (err) return fn(err)
    let deps = getDependencies(installed)
    if (!options.extraneous) deps = deps.filter(dep => !dep.extraneous)
    if (!options.dev) deps = deps.filter(dep => !isDevDependency(dep))
    fn(null, deps)
  })
}

function getPackage(dirname) {
  let pkgPath = join(dirname, 'package.json')
  try {
    return require(pkgPath)
  } catch (e) {
    throw new Error(`no package.json at ${pkgPath}`)
  }
}

function getDependencies(mod, result, visited, depth) {
  depth = depth || 0
  result = result || []
  visited = visited || {} // cache of realpaths
  var dependencies = mod.dependencies || []
  Object.keys(dependencies).forEach(name => {
    var dep = mod.dependencies[name]
    if (dep === mod) {
      delete mod.dependencies[name]
      return
    }
    if (typeof dep === 'string') return
    if (visited[dep.realPath]) return
    visited[dep.realPath] = true
    var obj = assign({dependencies: dep._dependencies}, dep)
    delete obj._dependencies
    result.push(assign({}, obj))
    getDependencies(dep, result, visited, depth + 1)
  })
  return result
}

function isDevDependency(dep) {
  if (dep.root) return false
  if (!dep.parent) return false
  var devDependencies = dep.parent.devDependencies || {}
  return devDependencies[dep.name] != null
}

function assign(target, firstSource) {
  if (target === undefined || target === null)
    throw new TypeError("Cannot convert first argument to object");
  var to = Object(target);
  for (var i = 1; i < arguments.length; i++) {
    var nextSource = arguments[i];
    if (nextSource === undefined || nextSource === null) continue;
    var keysArray = Object.keys(Object(nextSource));
    for (var nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex++) {
      var nextKey = keysArray[nextIndex];
      var desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
      if (desc !== undefined && desc.enumerable) to[nextKey] = nextSource[nextKey];
    }
  }
  return to;
}
module.exports = matchInstalled
module.exports.readInstalled = readInstalled
