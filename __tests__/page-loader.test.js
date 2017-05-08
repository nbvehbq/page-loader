import axios from 'axios';
import path from 'path';
import os from 'os';
import fs from 'mz/fs';
import httpAdapter from 'axios/lib/adapters/http';
import nock from 'nock';

import loadpage from '../src';

const host = 'https://localhost';
const testUrl = `${host}/test`;
const notExistUrl = `${host}/not_exist`;

axios.defaults.host = host;
axios.defaults.adapter = httpAdapter;

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

  it('loaded...', (done) => {
    loadpage(testUrl, tempPath)
      .then(() => {
        const fileContent = fs.readFileSync(
          path.resolve(tempPath, 'localhost-test.html'), 'utf-8');
        expect(fileContent).toBe('test data');
      })
      .catch(done.fail)
      .then(done);
  });

  it('page not exist...', (done) => {
    loadpage(notExistUrl, tempPath)
    .catch((err) => {
      expect(err.statusCode).toBe(404);
      done();
    });
  });
});
