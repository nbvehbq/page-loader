import path from 'path';
import os from 'os';
import fs from 'mz/fs';
import nock from 'nock';

import loadpage from '../src';

const host = 'http://localhost';
const testUrl = `${host}/test`;
const notExistUrl = `${host}/not_exist`;
const testHtml =
`<html>
<head>
<script src="/a/b/c.js"></script>
<link href="/c/d/f.png"/>
<img src="/f/j/i.png">
<img src="http://www.ya.ru/ya.png">
</head>
</html>`;

describe('Test page download suit', () => {
  let tempPath = '';

  beforeAll(() => {
    nock(host)
      .get('/test')
      .reply(200, 'test data')
      .get('/testhtml')
      .reply(200, testHtml)
      .get('/c/d/f.png')
      .reply(200, 'test f.png')
      .get('/a/b/c.js')
      .reply(200, 'test js')
      .get('/f/j/i.png')
      .reply(200, 'test i.png');
  });

  beforeEach(() => {
    tempPath = fs.mkdtempSync(path.join(os.tmpdir(), 'page-loader-'));
  });

  it('loaded...', () => {
    expect.assertions(1);
    return loadpage(testUrl, tempPath)
      .then(() => {
        const fileContent = fs.readFileSync(
          path.resolve(tempPath, 'localhost-test.html'), 'utf-8');
        expect(fileContent).toBe('test data');
      });
  });

  it('page not exist...', async () => {
    expect.assertions(1);
    return loadpage(notExistUrl, tempPath)
      .catch((err) => {
        expect(err.statusCode).toBe(404);
      });
  });

  it('loaded with resurces...', () => {
    expect.assertions(3);
    return loadpage(`${host}/testhtml`, tempPath)
      .then(() => {
        expect(fs.existsSync(
          path.resolve(tempPath, 'localhost-testhtml_files/c-d-f.png'))).toBeTruthy();
      })
      .then(() => {
        expect(fs.existsSync(
          path.resolve(tempPath, 'localhost-testhtml_files/a-b-c.js'))).toBeTruthy();
      })
      .then(() => {
        expect(fs.existsSync(
          path.resolve(tempPath, 'localhost-testhtml_files/f-j-i.png'))).toBeTruthy();
      });
  });
});
