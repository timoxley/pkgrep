"use strict";

var join = require("path").join;

module.exports = getDependencies;
module.exports.match = matchDependencies;

function getDependencies(dirname) {
  var options = arguments[1] === undefined ? {} : arguments[1];
  var pkgPath = join(dirname, "package.json");
  try {
    var pkg = require(pkgPath);
  } catch (e) {
    e.message = "No package.json at " + pkgPath;
    throw e;
  }
  var dep = pkg.dependencies || {};
  var deps = Object.keys(pkg.dependencies || {});
  var devDeps = options.dev ? Object.keys(pkg.devDependencies || {}) : [];
  return deps.concat(devDeps);
}

function matchDependencies(dirname) {
  var options = arguments[1] === undefined ? {} : arguments[1];
  var dependencies = arguments[2] === undefined ? [] : arguments[2];
  var deps = getDependencies(dirname, options);
  return deps.filter(function (dep) {
    return dependencies.indexOf(dep) !== -1;
  });
}

