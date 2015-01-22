#!/usr/bin/env node

"use strict"

var yargs = require('yargs')

var getDependencies = require('../')

var argv = yargs
.usage('Get dependencies in a package.\nUsage: $0')
.boolean('dev')
.boolean('match')
.boolean('match-all')
.alias('f', 'match')
.describe('f', 'match matching dependencies. Non-zero exit if none match.')
.alias('a', 'match-all')
.describe('match-all', 'match all matching dependencies. Non-zero exit if not all match.')
.alias('s', 'silent')
.describe('s', 'No visual output, exit codes only.')
.argv

var dirname = process.cwd()
if (argv['match'] || argv['match-all']) {
  var found = getDependencies.match(dirname, {dev: argv.dev}, argv._)
  if (!argv['silent']) console.log(found.join('\n'))
  if (argv['match-all']) {
    if (found.length !== argv._.length) return process.exit(1)
  } else {
    if (!found.length) return process.exit(1)
  }
  return process.exit()
} else {
  var found = getDependencies(dirname, {dev: argv.dev}, argv._)
  if (!argv['silent']) console.log(found.join('\n'))
  return process.exit()
}

