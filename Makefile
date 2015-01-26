BIN := $(PWD)/bin/installed.js
RUN := node $(BIN)

test: build
	# just a sanity check for now
	$(RUN)
	$(RUN) columnify
	$(RUN) --json
	$(RUN) --format="{dependencies.slide}"
	$(RUN) --format="{name} {path}"
	$(RUN) --format="{name} {path}" --no-unique
	$(RUN) --format="{name} {path}" --json
	$(RUN) --format="{name} {path}" --table
	$(RUN) --format="{name} {path}" --filter="dependencies.slide" --table --depth=1
	$(RUN) --format="{name} {path}" --filter="dependencies.slide" --table --json -d=1
	$(RUN) --format="{name} {dependencies.slide}" --strict --json --flat -d=1
	$(RUN) --format="{name} {dependencies.slide}" --strict --json -d=1
	$(RUN) --format="{name} {dependencies.slide}" --strict -d=1
	$(RUN) --format="{name} {dependencies.slide}" --table --strict -d=1
	$(RUN) --format="{name}" --filter="keywords.includes('parser')" --table --strict -d=1
	$(RUN) --format="" --table --strict
	$(RUN) --format="should be one line"
	$(RUN) --format="should be multiple lines" --no-unique

prepublish: build

build: installed.js bin/installed.js

installed.js: index.js
	6to5 index.js > installed.js

bin/installed.js: bin/index.js
	6to5 bin/index.js > bin/installed.js

.PHONY: test prepublish build
