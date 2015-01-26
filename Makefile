BIN := $(PWD)/bin/installed.js
RUN := node $(BIN)


prepublish: build

build: installed.js bin/installed.js

installed.js: index.js
	6to5 index.js > installed.js

bin/installed.js: bin/index.js
	6to5 bin/index.js > bin/installed.js

.PHONY: test prepublish build
