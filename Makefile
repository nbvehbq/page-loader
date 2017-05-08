install:
	npm install
start:
	npm run babel-node -- src/bin/page-loader.js --output /var/tmp https://hexlet.io/courses
publish:
	npm publish
lint:
	npm run eslint -- src __tests__
test:
	npm test
