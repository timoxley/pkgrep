"use strict"

const test = require('tape')
const getDependencies = require('../')

test('getting dependencies', t => {
  getDependencies(__dirname + '..')
  t.end()
})
