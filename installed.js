"use strict";

var _slicedToArray = function (arr, i) {
  if (Array.isArray(arr)) {
    return arr;
  } else {
    var _arr = [];

    for (var _iterator = arr[Symbol.iterator](), _step; !(_step = _iterator.next()).done;) {
      _arr.push(_step.value);

      if (i && _arr.length === i) break;
    }

    return _arr;
  }
};

var _require = require("path");

var join = _require.join;
var readInstalled = require("read-installed");
var semver = require("semver");

var DEFAULT_OPTIONS = Object.freeze({
  dev: false,
  depth: 0,
  extraneous: true
});

function matchInstalled(dirname, matches, options, fn) {
  var matches = arguments[1] === undefined ? [] : arguments[1];
  var options = arguments[2] === undefined ? DEFAULT_OPTIONS : arguments[2];
  return (function () {
    matches = matches.map(function (input) {
      var _input$split = input.split("@");

      var _input$split2 = _slicedToArray(_input$split, 2);

      var name = _input$split2[0];
      var _input$split2$1 = _input$split2[1];
      var semver = _input$split2$1 === undefined ? "*" : _input$split2$1;
      return { name: name, semver: semver };
    });
    read(dirname, options, function (err, deps) {
      if (err) return fn(err);
      // when no supplied versions to match, print everything.
      if (!matches.length) return fn(null, deps);
      var matchedMatches = {};
      deps = deps.filter(function (dep) {
        return matches.some(function (match) {
          if ((match.name === dep.name || match.name === dep.realName) && semver.satisfies(dep.version, match.semver)) {
            var matchKey = "" + match.name + "@" + match.semver;
            return matchedMatches[matchKey] = true;
          } else {
            return false;
          }
        });
      });
      fn(null, deps, Object.keys(matchedMatches));
    });
  })();
}

function read(dirname, options, fn) {
  var options = arguments[1] === undefined ? DEFAULT_OPTIONS : arguments[1];
  return (function () {
    readInstalled(dirname, options, function (err, installed) {
      if (err) return fn(err);
      var deps = getDependencies(installed);
      if (!options.extraneous) deps = deps.filter(function (dep) {
        return !dep.extraneous;
      });
      if (!options.dev) deps = deps.filter(function (dep) {
        return !isDevDependency(dep);
      });
      fn(null, deps);
    });
  })();
}

function getPackage(dirname) {
  var pkgPath = join(dirname, "package.json");
  try {
    return require(pkgPath);
  } catch (e) {
    throw new Error("no package.json at " + pkgPath);
  }
}

function getDependencies(mod, result, visited, depth) {
  depth = depth || 0;
  result = result || [];
  visited = visited || {}; // cache of realpaths
  var dependencies = mod.dependencies || [];
  Object.keys(dependencies).forEach(function (name) {
    var dep = mod.dependencies[name];
    if (dep === mod) return;
    if (typeof dep === "string") return;
    if (visited[dep.realPath]) return;
    visited[dep.realPath] = true;
    var obj = assign({ dependencies: dep._dependencies }, dep);
    delete obj._dependencies;
    result.push(assign({}, obj));
    getDependencies(dep, result, visited, depth + 1);
  });
  return result;
}

function isDevDependency(dep) {
  if (dep.root) return false;
  if (!dep.parent) return false;
  var devDependencies = dep.parent.devDependencies || {};
  return devDependencies[dep.name] != null;
}

function assign(target, firstSource) {
  if (target === undefined || target === null) throw new TypeError("Cannot convert first argument to object");
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
module.exports = matchInstalled;
module.exports.readInstalled = readInstalled;

