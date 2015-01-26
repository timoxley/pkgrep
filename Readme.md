## installed

Command-line tool for selectively displaying data about packages in node_modules.

## Installation

```
> npm install -g installed
```

## Usage

```
> installed  --help
Display data about installed packages.

Usage: installed [options] [name[@version] ...]

Examples:
  installed                                                            List all top-level dependencies
  installed inherits mkdirp                                            Check whether either mkdirp or inherits are installed. Only fails if none can be found.
  installed --all inherits mkdirp                                      Check whether both mkdirp and inherits are installed. Fails all dependencies are found.
  installed --depth=-1 mkdirp                                          Check whether mkdirp is installed at any depth.
  installed --dev mkdirp                                               Check for mkdirp as a dependency OR a devDependency. devDependencies are filtered-out by default.
  installed mkdirp@^1.0.0                                              Check whether mkdirp version matching ^1.0.0 is installed.
  installed --format="{name}" mkdirp inherits                          Only print names of matching installed dependencies at the top level.
  installed --format="{version} - {realPath}" mkdirp                   Print the version followed by a hyphen and the realpath to mkdirp.
  installed --table --format="{name} {license} {path}"                 Format top level dependency name, license and path as a table.
  installed --depth=-1 --unique --format="{name}@{version}"            List all dependencies, but only display unique name@version instances.
  installed --filter="scripts.test"                                    List only dependencies with a test script.
  installed --filter="dependencies.browserify"                         List only dependencies that depend on browserify.
  installed --filter="browserify.transform.indexOf('es6ify') == -1"    List only dependencies with es6ify as a browserify transform.
  installed --filter="dependencies.browserify" --dev                   List only dependencies that depend on browserify.


Options:
  --dev            Include development dependencies.
  --extraneous     Show extraneous dependencies                                                                      [default: true]
  --no-extraneous  Filter extraneous dependencies. This will include --dev dependencies if --dev is not enabled.
  --summary        Show summary after results on stderr.                                                             [default: true]
  --no-summary     Do not print any summary text to stderr. "e.g. 5 matching dependencies."
  --depth          Traversal depth. use --depth=Infinity or --depth=-1 to traverse entire dependency tree.           [default: 0]
  --format         Output format string. Place variables in {curlies}.                                               [default: "{name}@{version}"]
  --list-vars      List examples of possible --format & --table variables.
  --table          Show output in a table. Use --format to indicate desired columns. All non-variables are ignored.
  --unique         Only display unique lines of output.                                                              [default: true]
  --no-unique      Permit duplicate lines of output.
  --filter         Filter packages by an expression. See http://npm.im/to-function for syntax.                       [string]  [default: function filter() { [native code] }]
  --json           Generate JSON output. Respects keys used in --format. All non-variables are ignored.
  --flatten        Flatten --json output so there is no object nesting.
  --help           Show help
  --version        Show version number
```

## Examples

### List all top-level dependencies
```
> mkdir installed-cli-test && cd installed-cli-test
> npm init -f
> npm install inherits mkdirp --save
> installed
inherits@2.0.1
mkdirp@0.5.0
2 matching dependencies
```

### Traverse the node_modules hierarchy.

You can use `--depth` in combination with most other flags.

```
> npm install --save mkdirp
> installed --depth=-1
inherits@2.0.1
mkdirp@0.5.0
minimist@0.0.8
3 matching dependencies
```

### Check Whether a Package is Installed

If the package is not installed you'll get a non-zero exit-code:

```
> installed mkdirp || echo "package is not installed"
mkdirp@0.5.0
1 matching dependency

> installed bower || echo "package is not installed"
No matching dependencies!
package is not installed
```

You can pass any valid semver version in the format: name@semver:
```
> installed inherits@2.0.0
No matching dependencies!

> installed inherits@~2.0.0
inherits@2.0.1
1 matching dependency
```

### Check whether multiple packages are installed

```
> installed mkdirp inherits bower || echo "Failed."
inherits@2.0.1
mkdirp@0.5.0
2 matching dependencies.
```

### Ensure Packages are Installed

`--all` will exit with failure unless all listed packages are matched.

```
> installed --all mkdirp inherits bower || echo "Failed."
inherits@2.0.1
mkdirp@0.5.0
2 matching dependencies.
2 out of 3 matches.
Failed.
```

`--all` will exit with failure unless all packages are matched.

```
> installed --all mkdirp inherits bower || echo "Failed."
inherits@2.0.1
mkdirp@0.5.0
2 matching dependencies.
2 out of 3 matches.
Failed.
```

### Include devDependencies

Use `--dev` to include devDependencies.

```
> npm install --save-dev tape
> installed tape

No matching dependencies!

> installed tape --dev
tape@3.4.0
1 matching dependency
```

### Custom Output Data and Formats

Use `--format` to control output. Variables are enclosed in single
curlies.

```
> installed --format="{name}"
inherits
mkdirp
2 dependencies.
> installed --format="{name}@{version} - {realPath}"
inherits@2.0.1 - /Users/timoxley/Projects/test/installed-cli-test/node_modules/inherits
mkdirp@0.5.0 - /Users/timoxley/Projects/test/installed-cli-test/node_modules/mkdirp
2 dependencies.
```

### Print Nested Properties

```
> installed --format='{name} "{scripts.test}"'
inherits "node test"
mkdirp "tap test/*.js"
2 dependencies.
```

### List Available Format Variables

```
> installed --list-vars
Possible format keys:
KEY                   VALUE
name                  installed-cli-test
version               1.0.0
description
main                  index.js
scripts.test          echo "Error: no test specified" && exit 1
keywords
author.name           Tim Oxley
author.email          secoif@gmail.com
license               ISC
dependencies.inherits ^2.0.1
dependencies.mkdirp   ^0.5.0
devDependencies.tape  ^3.4.0
readme                ERROR: No README data found!
_id                   installed-cli-test@1.0.0
realName              installed-cli-test
extraneous            false
path                  /Users/timoxley/test/installed-clie-test
realPath              /Users/timoxley/test/installed-clie-test
link
depth                 0
peerDependencies      [object Object]
root                  true
```

### Table Output

Formatting courtesy of [columnify](https://github.com/timoxley/columnify).

```
> installed --table

installed --table --depth=-1
NAME           VERSION
inherits       2.0.1
mkdirp         0.5.0
minimist       0.0.8
deep-equal     0.2.1
defined        0.0.0
glob           3.2.11
minimatch      0.3.0
lru-cache      2.5.0
sigmund        1.0.0
object-inspect 0.4.0
resumer        0.0.0
through        2.3.6
12 dependencies.
```


### Control Table Columns

To make it easy to flip between text and table output, all whitespace &
non-variable characters in the `--format` string are totally ignored.
The variables are collected and used as table columns.

```
> installed --format="{name}@{version} - {realPath}" --table
NAME     VERSION REALPATH
inherits 2.0.1   /Users/timoxley/Projects/get-dependencies/installed-cli-test/node_modules/inherits
mkdirp   0.5.0   /Users/timoxley/Projects/get-dependencies/installed-cli-test/node_modules/mkdirp
2 dependencies.
```

### JSON Output

Use `--json` to get JSON Output.

```
> installed --format="{name} {scripts.test}" --json
[
  {
    "name": "inherits",
    "scripts": {
      "test": "node test"
    }
  },
  {
    "name": "mkdirp",
    "scripts": {
      "test": "tap test/*.js"
    }
  }
]
2 dependencies.
```

### Flatten JSON Output

Use `--flatten` with `--json` to remove JSON object nesting.

```
> installed --format="{name} {scripts.test}" --json --flatten
[
  {
    "name": "inherits",
    "scripts.test": "node test"
  },
  {
    "name": "mkdirp",
    "scripts.test": "tap test/*.js"
  }
]
2 dependencies.
```

### Filter Output with Simple Expressions

`installed` uses [to-function](https://www.npmjs.com/package/to-function) to parse simple filter expressions.

For example, we can list only dependencies that depend on tap in their devDependencies:

```
> installed --filter="devDependencies.tap" --depth=-1
NAME     VERSION REALPATH
inherits 2.0.1   /Users/timoxley/Projects/get-dependencies/installed-cli-test/node_modules/inherits
mkdirp   0.5.0   /Users/timoxley/Projects/get-dependencies/installed-cli-test/node_modules/mkdirp
2 dependencies.
```

## TODO

* Find tool with more flexible, less fragile filtering syntax, without sacrificing too much readability.
* Gather more usecases.
* Integration tests.

## License

MIT
