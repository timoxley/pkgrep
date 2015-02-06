BIN := $(shell node -e "var pkg = require('./package.json'); console.log(pkg.bin[pkg.name] || pkg.bin)")
RUN := node $(BIN)

test: build
	# sanity check various commands
	$(RUN)
	$(RUN) columnify | grep 'columnify@'
	$(RUN) --json | grep '"name": "columnify"'
	$(RUN) --format="{dependencies.strip-ansi}" | grep "^"
	$(RUN) --format="{name} {path}" | grep "columnify"
	$(RUN) --format="{name} {path}" --no-unique | grep "columnify"
	$(RUN) --format="{name} {path}" --no-unique --depth=-1 | grep wrappy | cut -d " " -f 1 | xargs echo | grep "wrappy wrappy"
	$(RUN) --format="{name} {path}" --json | grep 'name\|path' | cut -d " " -f 5 | xargs echo | grep "name: path: name: path:"
	$(RUN) --format="{name} {path}" --table
	$(RUN) --format="{name} {path}" --filter="dependencies.glob" --table --depth=2
	$(RUN) --format="{name} {path}" --filter="dependencies.glob" --table --json -d=2
	$(RUN) --format="{name} {dependencies.glob}" --strict --json --flat -d=2
	$(RUN) --format="{name} {dependencies.glob}" --strict --json -d=2
	$(RUN) --format="{name} {dependencies.glob}" --strict -d=2
	$(RUN) --format="{name} {dependencies.glob}" --table --strict -d=2
	$(RUN) --format="{name}" --filter="keywords.includes('parser')" --table --strict -d=2
	$(RUN) --format="" --table --strict
	$(RUN) --format="should be one line"
	$(RUN) --format="should be multiple lines" --no-unique
	$(RUN) --list-vars

prepublish: build
	npm prune --production
	npm test
	npm install --cache-min=Infinity --silent --ignore-scripts
	npm rebuild

build: pkgrep.js bin/pkgrep.js

pkgrep.js: index.js
	6to5 index.js > pkgrep.js

bin/pkgrep.js: bin/index.js
	6to5 bin/index.js > bin/pkgrep.js

.PHONY: test prepublish build
