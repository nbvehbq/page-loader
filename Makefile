install:
	npm install
start:
	npm run babel-node -- src/bin/page-loader.js -h
publish:
	npm publish
lint:
	npm run eslint -- src __tests__
test:
	npm test
