"use strict"

const {join} = require('path')
const semver = require('semver')
const read = require('installed')

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

module.exports = matchInstalled
