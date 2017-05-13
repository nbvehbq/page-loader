import path from 'path';
import url from 'url';
import fs from 'mz/fs';
import cheerio from 'cheerio';
import debuger from 'debug';

import axios from './lib/axios';

const debug = debuger('page-loader:main');
const reslog = debuger('page-loader:resurces');

const requestObects = [
  { name: 'link', href: 'href' },
  { name: 'img', href: 'src' },
  { name: 'script', href: 'src' },
];

const buildFileName = (uri) => {
  const { dir, name, ext } = path.parse(uri);
  const filename = path.join(dir, name);
  const urlObj = url.parse(filename, true);

  const result = [urlObj.host, urlObj.path].join('')
    .replace(/\W+/g, '-').replace(/^-/, '');

  if (ext) {
    return `${result}${ext}`;
  }
  return result;
};

const getLocalUrls = (data) => {
  const $ = cheerio.load(data);

  return requestObects.reduce((acc, item) => {
    const links = $(item.name).map((i, el) => $(el).attr(item.href)).get()
      .filter(link => url.parse(link, true).host === null);
    return [...acc, ...links];
  }, []);
};

const changeUrls = (data, base) => {
  const $ = cheerio.load(data);

  requestObects.forEach((item) => {
    $(item.name).each((i, el) => {
      const ref = $(el).attr(item.href);
      if (!ref) return ref;
      const urlObj = url.parse(ref, true);
      if (urlObj.host !== null) return ref;

      $(el).attr(item.href, path.join(base, buildFileName(ref)));
      return ref;
    });
  });

  debug('replace url with local links complited...');
  return $.html();
};

const loadAndSave = (uri, basePath, host) =>
  axios.get(url.resolve(host, uri), { responseType: 'arraybuffer' })
    .then((response) => {
      reslog('resurce [%s] loadeded', uri);
      const savedName = buildFileName(uri);
      return fs.writeFile(path.resolve(basePath, savedName), response.data)
      .then(() => reslog('...and saved as [%s]', savedName));
    })
    .catch(err => err);

export default (uri, output = '.') => {
  const basename = buildFileName(uri);
  const filename = `${path.resolve(output, basename)}.html`;
  const foldername = `${path.resolve(output, basename)}_files`;

  return fs.exists(output)
    .then((exists) => {
      if (!exists) throw new Error(`Output directory: ${output} not exist`);
      return exists;
    })
    .then(() => fs.exists(filename))
    .then((exists) => {
      if (exists) {
        throw new Error(`Url: ${uri} already downloaded in same directory`);
      }
      return exists;
    })
    .then(() => axios.get(uri)
    .then((response) => {
      debug('page [%s] loadeded...', uri);
      const localUrls = getLocalUrls(response.data);
      debug('urls count: %d', localUrls.length);
      const content = changeUrls(response.data, `${basename}_files`);
      return { localUrls, content };
    })
    .then((data) => {
      const writeFilePromise = fs.writeFile(filename, data.content)
        .then(() => debug('page [%s] saved as [%s]', uri, filename));

      if (data.localUrls.length > 0) {
        return fs.mkdir(foldername).then(() => Promise.all([
          data.localUrls.map(item => loadAndSave(item, foldername, uri)),
          writeFilePromise,
        ]));
      }
      return writeFilePromise;
    })
    .then(() => 'Download complited'));
};
