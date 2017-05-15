import path from 'path';
import url from 'url';
import fs from 'mz/fs';
import cheerio from 'cheerio';
import debuger from 'debug';
import Listr from 'listr';

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
      const content = response.data;
      const savedName = buildFileName(uri);
      reslog('resurce [%s] loadeded', uri);
      return { content, savedName };
    })
    .then(data => fs.writeFile(path.resolve(basePath, data.savedName), data.content)
      .then(() => reslog('...and saved as [%s]', data.savedName)))
    .catch(err => err);

export default (uri, output = '.') => {
  const basename = buildFileName(uri);
  const filename = `${path.resolve(output, basename)}.html`;
  const foldername = `${path.resolve(output, basename)}_files`;

  const task = new Listr([
    {
      title: 'Cheking dirrs...',
      task: () => new Listr([
        {
          title: 'Checking output directory...',
          task: () => fs.exists(output)
            .then((exists) => {
              if (!exists) {
                return Promise.reject(new Error(`Output directory: ${output} not exist`));
              }
              return exists;
            }),
        },
        {
          title: 'Checking already downloaded...',
          task: () => fs.exists(filename)
            .then((exists) => {
              if (exists) {
                return Promise.reject(new Error(`Url: ${uri} already downloaded in same directory`));
              }
              return exists;
            }),
        },
      ], { concurrent: true }),
    },
    {
      title: `Downloading page [${uri}]`,
      task: ctx => axios.get(uri)
        .then((response) => {
          debug('page [%s] loadeded...', uri);
          ctx.localUrls = getLocalUrls(response.data);
          debug('urls count: %d', ctx.localUrls.length);
          ctx.content = changeUrls(response.data, `${basename}_files`);
        }),
    },
    {
      title: `Saving page as [${basename}]`,
      task: ctx => fs.writeFile(filename, ctx.content)
        .then(() => debug('page [%s] saved as [%s]', uri, filename)),
    },
    {
      title: 'Downloading resources',
      task: ctx => fs.mkdir(foldername).then(() =>
          Promise.all(ctx.localUrls.map(item => loadAndSave(item, foldername, uri)))),
    },
  ]);

  return task.run().catch(err => Promise.reject(err));
};
