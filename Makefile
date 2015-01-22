RUN := node bin/get-dependencies.js

prepublish: getDependencies.js

test: getDependencies.js
	-@ echo "Test: $(RUN)"
	-@ $(RUN) || (echo "Failed no args" && exit 1)
	-@ echo
	-@ echo "Test: cd test && !($(RUN))"
	-@ cd test && !($(RUN)) || (echo "Failed in no package.json dir" && exit 1)
	-@ echo
	-@ echo "Test: !($(RUN) --match asdf)"
	-@ !($(RUN) --match asdf) || (echo "Failed --match asdf" && exit 1)
	-@ echo
	-@ echo "Test: $(RUN) --match yargs"
	-@ $(RUN) --match yargs || (echo "Failed --match yargs" && exit 1)
	-@ echo
	-@ echo "Test: $(RUN) --match yargs asdf"
	-@ $(RUN) --match yargs asdf || (echo "Failed --match yargs asdf" && exit 1)
	-@ echo
	-@ echo "Test: !($(RUN) --match-all yargs asdf)"
	-@ !($(RUN) --match-all yargs asdf) || (echo "Failed --match-all yargs asdf" && exit 1)
	-@ echo

getDependencies.js: index.js
	6to5 index.js > getDependencies.js

.PHONY: test prepublish
