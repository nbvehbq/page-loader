import path from 'path';
import os from 'os';
import fs from 'mz/fs';
import nock from 'nock';

import loadpage from '../src';

const host = 'http://localhost';
const testUrl = `${host}/test`;
const notExistUrl = `${host}/not_exist`;

describe('Test page download suit', () => {
  let tempPath = '';

  beforeAll(() => {
    nock(host)
      .get('/test')
      .reply(200, 'test data');
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
});
