#!/usr/bin/env node


"use strict";

var argv = require("yargs").usage("Display data about installed packages.\n\nUsage: $0 [options] [name[@version] ...]").boolean("dev").describe("dev", "Include development dependencies.").boolean("extraneous")["default"]("extraneous", true).describe("extraneous", "Show extraneous dependencies").describe("no-extraneous", "Filter extraneous dependencies. This will include --dev dependencies if --dev is not enabled.").boolean("summary")["default"]("summary", true).describe("summary", "Show summary after results on stderr.").describe("no-summary", "Do not print any summary text to stderr. \"e.g. 5 matching dependencies.\"").describe("depth", "Traversal depth. use --depth=Infinity or --depth=-1 to traverse entire dependency tree.")["default"]("depth", 0).boolean("all").alias("a", "all").describe("all", "Match all dependencies. non-zero exit if not all match.").alias("s", "silent").describe("silent", "No visual output, exit codes only.").string("format").describe("format", "Output format string. Place variables in {curlies}.")["default"]("format", "{name}@{version}").boolean("list-vars").describe("list-vars", "List examples of possible --format & --table variables.").boolean("table").describe("table", "Show output in a table. Use --format to indicate desired columns. All non-variables are ignored.").boolean("unique")["default"]("unique", true).describe("unique", "Only display unique lines of output.").describe("no-unique", "Permit duplicate lines of output.").string("filter").describe("filter", "Filter packages by an expression. See http://npm.im/to-function for syntax.").boolean("strict").describe("strict", "Only list packages which contain all variables in --format.").boolean("json").describe("json", "Generate JSON output. Respects keys used in --format. All non-variables are ignored.").boolean("flatten").describe("flatten", "Flatten --json output so there is no object nesting.").example("$0", "List all top-level dependencies")
//.example('$0 mkdirp', 'Check whether any version of mkdirp is installed at the top level.')
.example("$0 inherits mkdirp", "Check whether either mkdirp or inherits are installed. Only fails if none can be found.").example("$0 --all inherits mkdirp", "Check whether both mkdirp and inherits are installed. Fails all dependencies are found.")
//.example('$0 --depth=-1', 'List all dependencies at any depth.')
.example("$0 --depth=-1 mkdirp", "Check whether mkdirp is installed at any depth.")
//.example('$0 --dev', 'List all top-level dependencies, including devDependencies.')
.example("$0 --dev mkdirp", "Check for mkdirp as a dependency OR a devDependency. devDependencies are filtered-out by default.")
//.example('$0 mkdirp@1.3.2', 'Check whether specifically mkdirp@1.3.2 is installed.')
.example("$0 mkdirp@^1.0.0", "Check whether mkdirp version matching ^1.0.0 is installed.")
//.example('$0 --no-extraneous', 'List all packages, ignoring extraneous dependencies.')
//.example('$0 --table', 'Format top level dependencies name & version as a table.')
.example("$0 --format=\"{name}\" mkdirp inherits", "Only print names of matching installed dependencies at the top level.").example("$0 --format=\"{version} - {realPath}\" mkdirp", "Print the version followed by a hyphen and the realpath to mkdirp.").example("$0 --table --format=\"{name} {license} {path}\"", "Format top level dependency name, license and path as a table.").example("$0 --depth=-1 --unique --format=\"{name}@{version}\"", "List all dependencies, but only display unique name@version instances.").example("$0 --filter=\"scripts.test\"", "List only dependencies with a test script.").example("$0 --filter=\"dependencies.browserify\"", "List only dependencies that depend on browserify.").example("$0 --filter=\"browserify.transform.indexOf('es6ify') == -1\"", "List only dependencies with es6ify as a browserify transform.").example("$0 --filter=\"dependencies.browserify\" --dev", "List only dependencies that depend on browserify.").help("help").version(require("../package.json").version, "version").argv;

var matchInstalled = require("../");

var template = require("hogan");
var columnify = require("columnify");
var split = require("split-object");
var flat = require("flat");
var toFunction = require("to-function");
var stringToRegexp = require("string-to-regexp");
var stringify = require("json-stringify-safe");
var he = require("he");

var dirname = process.cwd();
var toMatch = argv._;
var hasError = 0;

if (argv.depth === "Infinity") argv.depth = Infinity;
if (argv.depth === -1) argv.depth = Infinity;

if (argv["list-vars"]) {
  logError("Possible format keys:");
  possibleFormatKeys(dirname);
  return;
}

function inspect(item) {
  // for debugging
  console.log(require("util").inspect(item, { colors: true, depth: 30 }));
}



matchInstalled(dirname, toMatch, argv, function (err, pkgs, matched) {
  if (err) throw err;
  matched = matched || [];
  pkgs = pkgs || [];
  if (argv.strict && argv.format) {
    pkgs = filterByFormat(pkgs, argv.format);
  }
  if (argv.filter) {
    if (argv.filter[0] === "/") {
      argv.filter = stringToRegexp(argv.filter);
    }
    var filter = toFunction(argv.filter);
    pkgs = pkgs.filter(function (pkg) {
      try {
        return filter(pkg);
      } catch (e) {
        return false;
      }
    });
  }

  var resultTotal = pkgs.length;

  if (argv.json) {
    if (argv.format) {
      var outData = formatObject(pkgs, argv.format);
      if (!argv.flatten) {
        outData = outData.map(function (data) {
          return flat.unflatten(data, { safe: true, object: true });
        });
      }
      if (argv.table) {
        outData = split(outData);
      }
      log(stringify(outData, null, 2));
    } else {
      var outData = pkgs;
      if (argv.flatten) outData = flat(outData);
      log(stringify(outData, null, 2));
    }
  } else {
    var outputText = argv.table ? renderTable(pkgs, argv) : renderText(pkgs, argv);
    outputText = outputText;

    var lines = outputText.split("\n");
    // remove empty lines
    lines = lines.map(function (line) {
      return line.trim();
    }).filter(Boolean);

    if (argv.unique) {
      var uniqueLines = lines.filter(function (line, index, arr) {
        return arr.lastIndexOf(line) === index;
      });
      resultTotal = resultTotal - (lines.length - uniqueLines.length);
      lines = uniqueLines;
    }
    log(lines.join("\n"));
  }

  var matchingWord = argv._.length ? "matching " : "";

  switch (resultTotal) {
    case 0:
      summary("No %sdependencies!", matchingWord);
      hasError = 1;
      break;
    case 1:
      summary("%d %sdependency", resultTotal, matchingWord);
      break;
    default:
      summary("%d %sdependencies.", resultTotal, matchingWord);
      break;
  }

  if (argv.all) {
    summary("%d out of %d matches.", matched.length, toMatch.length);
    if (toMatch.length !== matched.length) hasError = 2;
  }

  return process.exit(hasError);
});

var DELIMITERS = "{ }";

function renderText(pkgs, options) {
  return pkgs.map(function (pkg) {
    pkg = Object.create(pkg);
    return template.compile(options.format, { delimiters: DELIMITERS }).render(pkg);
  }).join("\n");
}

function filterByFormat(pkgs, format) {
  var vars = getVars(pkgs, format);
  return pkgs.filter(function (pkg) {
    return vars.every(function (v) {
      return v.value.render(pkg) !== "";
    }, {});
    return obj;
  });
}

function formatObject(pkgs, format) {
  var vars = getVars(pkgs, format);
  return pkgs.map(function (pkg) {
    return vars.reduce(function (obj, v) {
      obj[v.key] = he.decode(v.value.render(pkg));
      return obj;
    }, {});
    return obj;
  });
}

function getVars(pkgs, format) {
  var VARIABLE_TAG = "_v";
  var templateOpts = { delimiters: DELIMITERS };
  var tree = template.parse(template.scan(format, templateOpts.delimiters));
  var names = tree.filter(function (item) {
    return item.tag === VARIABLE_TAG;
  }).reduce(function (names, item, index, arr) {
    var prev = names[names.length - 1];
    if (!prev) item.i = getLength(item);else item.i = prev.i + getLength(item);
    names.push(item);
    return names;
  }, []);
  return names.map(function (item) {
    return {
      key: item.n,
      value: template.generate([item], "", templateOpts)
    };
  });
}

function renderTable(pkgs, options) {
  return columnify(formatObject(pkgs, options.format));
}

function getLength(item) {
  return item.n.length + item.otag.length + item.ctag.length;
}

function logError() {
  if (argv.silent) return;
  console.error.apply(console, arguments);
}

function log() {
  if (argv.silent) return;
  console.log.apply(console, arguments);
}

function summary() {
  if (!argv.summary) return;
  logError.apply(null, arguments);
}

function getNameAtVersionPath(pkg) {
  return pkg.name + "@" + pkg.version + " " + pkg.realPath;
}

function getNameAtVersion(pkg) {
  return pkg.name + "@" + pkg.version;
}

function getName(pkg) {
  return pkg.name;
}
function inspect(item) {
  // for debugging
  console.log(require("util").inspect(item, { colors: true, depth: 30 }));
}
function possibleFormatKeys(dirname, options) {
  matchInstalled.readInstalled(dirname, options, function (err, installed) {
    if (err) throw err;
    installed.dependencies = installed._dependencies;
    delete installed._dependencies;
    log(columnify(split(flat(installed)), {
      truncate: true,
      config: {
        key: { maxWidth: 50 },
        value: { maxWidth: 50 }
      }
    }));
    process.exit(0);
  });
}

