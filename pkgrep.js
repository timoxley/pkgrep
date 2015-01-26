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
var semver = require("semver");
var read = require("installed");

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

module.exports = matchInstalled;

