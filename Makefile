BIN := $(PWD)/bin/installed.js
RUN := node $(BIN)


#test: installed.js
	#@ echo "Test: installed"
	#@ $(RUN) || (echo "Failed no args" && exit 1)
	#@ echo
	#@ echo "Test: cd test && !(installed)"
	#@ cd test && !($(RUN)) || (echo "Failed in no package.json dir" && exit 1)
	#@ echo
	#@ echo "Test: !(installed --match asdf)"
	#@ !($(RUN) --match asdf) || (echo "Failed --match asdf" && exit 1)
	#@ echo
	#@ echo "Test: installed --match yargs"
	#@ $(RUN) --match yargs || (echo "Failed --match yargs" && exit 1)
	#@ echo
	#@ echo "Test: installed --match yargs asdf"
	#@ $(RUN) --match yargs asdf || (echo "Failed --match yargs asdf" && exit 1)
	#@ echo
	#@ echo "Test: !(installed --match-all yargs asdf)"
	#@ !($(RUN) --match-all yargs asdf) || (echo "Failed --match-all yargs asdf" && exit 1)
	#@ echo "Test: --dev --all yargs tape "
	#@ $(RUN) --dev --match-all yargs tape || (echo "Failed --dev --match-all yargs tape" && exit 1)
	#@ echo
	#@ echo "Test Success!"

prepublish: installed.js
installed.js: index.js
	6to5 index.js > installed.js

.PHONY: test prepublish
