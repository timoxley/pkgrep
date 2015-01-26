## pkgrep

Powerful CLI tool to find, filter & format package data in node_modules.

## Installation

```
> npm install -g pkgrep
```

## Usage

```
Find, filter & format package data in node_modules.

Usage: pkgrep [options] [name[@version] ...]

Examples:
  pkgrep                                                       List all top-level dependencies
  pkgrep inherits mkdirp                                       Check whether either mkdirp or inherits are installed. Only fails if none can be found.
  pkgrep --all inherits mkdirp                                 Check whether both mkdirp and inherits are installed. Fails all dependencies are found.
  pkgrep --depth=-1 mkdirp                                     Check whether mkdirp is installed at any depth.
  pkgrep --dev mkdirp                                          Check for mkdirp as a dependency OR a devDependency. devDependencies are filtered-out by default.
  pkgrep mkdirp@^1.0.0                                         Check whether mkdirp version matching ^1.0.0 is installed.
  pkgrep --format="{name}" mkdirp inherits                     Only print names of matching installed dependencies at the top level.
  pkgrep --format="{version} - {realPath}" mkdirp              Print the version followed by a hyphen and the realpath to mkdirp.
  pkgrep --table --format="{name} {license} {path}"            Format top level dependency name, license and path as a table.
  pkgrep --depth=-1 --unique --format="{name}@{version}"       List all dependencies, but only display unique name@version instances.
  pkgrep --filter="scripts.test"                               List only dependencies with a test script.
  pkgrep --filter="dependencies.browserify"                    List only dependencies that depend on browserify.
  pkgrep --filter="browserify.transform.includes('es6ify')"    List only dependencies with es6ify as a browserify transform (Note: ES6 prototype features are shimmed).
  pkgrep --filter="dependencies.browserify" --dev              List only dependencies that depend on browserify.


Options:
  -a, --all        Match all dependencies. non-zero exit if not all match.
  -d, --depth      Traversal depth. use --depth=Infinity or --depth=-1 to traverse entire dependency tree.            [default: 0]
  -f, --format     Output format string. Place variables in {curlies}.                                                [default: "{name}@{version}"]
  -t, --table      Show output in a table. Use --format to indicate desired columns. All non-variables are ignored.
  -s, --strict     Only list packages which contain all variables in --format.
  -x, --filter     Filter packages using an arbitrary ES6 expression. No return statement required. Use at own risk.
  --dev            Include development dependencies.
  --extraneous     Show extraneous dependencies                                                                       [default: true]
  --no-extraneous  Filter extraneous dependencies. This will include --dev dependencies if --dev is not enabled.
  --flatten        Flatten --json output so there is no object nesting.
  --json           Generate JSON output. Respects keys used in --format. All non-variables are ignored.
  --list-vars      List examples of possible --format & --table variables.
  --summary        Show summary after results on stderr.                                                              [default: true]
  --no-summary     Do not print any summary text to stderr. "e.g. 5 matching dependencies."
  --silent         No visual output, exit codes only.
  --unique         Only display unique lines of output.                                                               [default: true]
  --no-unique      Do not remove duplicate lines of output.
  --help           Show help
  --version        Show version number
```

## Examples

### List all top-level dependencies

```
> mkdir pkgrep-cli-test && cd pkgrep-cli-test
> npm init -f
> npm install inherits mkdirp --save
> pkgrep
inherits@2.0.1
mkdirp@0.5.0
2 matching dependencies
```

### Traverse the node_modules hierarchy.

You can use `--depth` in combination with most other flags.

```
> npm install --save mkdirp
> pkgrep --depth=-1
inherits@2.0.1
mkdirp@0.5.0
minimist@0.0.8
3 matching dependencies
```

### Check Whether a Package is Installed

If the package is not installed you'll get a non-zero exit-code:

```
> pkgrep mkdirp || echo "package is not installed"
mkdirp@0.5.0
1 matching dependency

> pkgrep bower || echo "package is not installed"
No matching dependencies!
package is not installed
```

You can pass any valid semver version in the format: name@semver:
```
> pkgrep inherits@2.0.0
No matching dependencies!

> pkgrep inherits@~2.0.0
inherits@2.0.1
1 matching dependency
```

### Check whether multiple packages are installed

```
> pkgrep mkdirp inherits bower || echo "Failed."
inherits@2.0.1
mkdirp@0.5.0
2 matching dependencies.
```

### Ensure Packages are Installed

`--all` will exit with failure unless all listed packages are matched.

```
> pkgrep --all mkdirp inherits bower || echo "Failed."
inherits@2.0.1
mkdirp@0.5.0
2 matching dependencies.
2 out of 3 matches.
Failed.
```

`--all` will exit with failure unless all packages are matched.

```
> pkgrep --all mkdirp inherits bower || echo "Failed."
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
> pkgrep tape

No matching dependencies!

> pkgrep tape --dev
tape@3.4.0
1 matching dependency
```

### Custom Output Data and Formats

Use `--format` to control output. Variables are enclosed in single
curlies.

```
> pkgrep --format="{name}"
inherits
mkdirp
2 dependencies.
> pkgrep --format="{name}@{version} - {realPath}"
inherits@2.0.1 - /Users/timoxley/Projects/test/pkgrep-cli-test/node_modules/inherits
mkdirp@0.5.0 - /Users/timoxley/Projects/test/pkgrep-cli-test/node_modules/mkdirp
2 dependencies.
```

### Print Nested Properties

```
> pkgrep --format='{name} "{scripts.test}"'
inherits "node test"
mkdirp "tap test/*.js"
2 dependencies.
```

### List Available Format Variables

```
> pkgrep --list-vars
Possible format keys:
KEY                   VALUE
name                  pkgrep-cli-test
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
_id                   pkgrep-cli-test@1.0.0
realName              pkgrep-cli-test
extraneous            false
path                  /Users/timoxley/test/pkgrep-cli-test
realPath              /Users/timoxley/test/pkgrep-cli-test
link
depth                 0
peerDependencies      [object Object]
root                  true
```

### Table Output

Formatting courtesy of [columnify](https://github.com/timoxley/columnify).

```
> pkgrep --table

pkgrep --table --depth=-1
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
> pkgrep --format="{name}@{version} - {realPath}" --table
NAME     VERSION REALPATH
inherits 2.0.1   /Users/timoxley/Projects/get-dependencies/pkgrep-cli-test/node_modules/inherits
mkdirp   0.5.0   /Users/timoxley/Projects/get-dependencies/pkgrep-cli-test/node_modules/mkdirp
2 dependencies.
```

### JSON Output

Use `--json` to get JSON Output.

```
> pkgrep --format="{name} {scripts.test}" --json
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
> pkgrep --format="{name} {scripts.test}" --json --flatten
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

### Filtering Packages

`pkgrep` permits using arbitrary ES6 expressions. Use at own risk.

All package properties are in scope as if the code was executed within a
`with` statement. No return statement is required for single-line
expressions.

For example, we can list only dependencies that depend on `tap` in their
devDependencies:

```
> pkgrep --filter="devDependencies.tap" --depth=-1
NAME     VERSION REALPATH
inherits 2.0.1   /Users/timoxley/Projects/get-dependencies/pkgrep-cli-test/node_modules/inherits
mkdirp   0.5.0   /Users/timoxley/Projects/get-dependencies/pkgrep-cli-test/node_modules/mkdirp
2 dependencies.
```

## TODO

* Gather more usecases.
* Integration tests.

## License

MIT
