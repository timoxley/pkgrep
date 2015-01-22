"use strict"

const join = require('path').join

module.exports = getDependencies
module.exports.match = matchDependencies

function getDependencies(dirname, options = {}) {
  let pkgPath = join(dirname, 'package.json')
  try {
    var pkg = require(pkgPath)
  } catch (e) {
    e.message = `No package.json at ${pkgPath}`
    throw e
  }
  let dep = pkg.dependencies || {}
  let deps = Object.keys(pkg.dependencies || {})
  let devDeps = options.dev ? Object.keys(pkg.devDependencies || {}) : []
  return deps.concat(devDeps)
}

function matchDependencies(dirname, options = {}, dependencies = []) {
  let deps = getDependencies(dirname, options)
  return deps.filter(dep => dependencies.indexOf(dep) !== -1)
}
