import path from 'path';
import url from 'url';
import fs from 'mz/fs';
import cheerio from 'cheerio';

import axios from './lib/axios';

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

  return $.html();
};

const loadAndSave = (uri, basePath, host) =>
  axios.get(url.resolve(host, uri), { responseType: 'arraybuffer' })
    .then(response =>
      fs.writeFile(path.resolve(basePath, buildFileName(uri)), response.data));

export default (uri, output = '.') => {
  const basename = buildFileName(uri);
  const filename = `${path.resolve(output, basename)}.html`;
  const foldername = `${path.resolve(output, basename)}_files`;

  return axios.get(uri)
  .then((response) => {
    const localUrls = getLocalUrls(response.data);
    if (localUrls.length > 0) {
      fs.mkdir(foldername);
    }
    const newContent = changeUrls(response.data, `${basename}_files`);
    return Promise.all([
      localUrls.map(item => loadAndSave(item, foldername, uri)),
      fs.writeFile(filename, newContent),
    ]);
  });
};
