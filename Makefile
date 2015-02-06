BIN := $(shell node -e "var pkg = require('./package.json'); console.log(pkg.bin[pkg.name] || pkg.bin)")
RUN := node $(BIN)

test: build
	# sanity check various commands
	$(RUN)
	$(RUN) columnify
	$(RUN) --json
	$(RUN) --format="{dependencies.slide}"
	$(RUN) --format="{name} {path}"
	$(RUN) --format="{name} {path}" --no-unique
	$(RUN) --format="{name} {path}" --json
	$(RUN) --format="{name} {path}" --table
	$(RUN) --format="{name} {path}" --filter="dependencies.slide" --table --depth=2
	$(RUN) --format="{name} {path}" --filter="dependencies.slide" --table --json -d=2
	$(RUN) --format="{name} {dependencies.slide}" --strict --json --flat -d=2
	$(RUN) --format="{name} {dependencies.slide}" --strict --json -d=2
	$(RUN) --format="{name} {dependencies.slide}" --strict -d=2
	$(RUN) --format="{name} {dependencies.slide}" --table --strict -d=2
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
