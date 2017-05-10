import path from 'path';
import url from 'url';
import fs from 'mz/fs';
import cheerio from 'cheerio';

import axios from './lib/axios';

const buildPathNameFromUrl = (request, ext = '.html') => {
  const urlObject = url.parse(request, true);
  return `${[urlObject.host, urlObject.path]
    .join('')
    .replace(/\W+/g, '-')}${ext}`;
};

const getLocalUrls = (data) => {
  const requestObects = [
    { name: 'link', href: 'href' },
    { name: 'img', href: 'src' },
    { name: 'script', href: 'src' },
  ];
  const $ = cheerio.load(data);

  return requestObects.reduce((acc, item) => {
    const links = $(item.name).map((i, el) => $(el).attr(item.href)).get()
      .filter((link) => {
        const urlObject = url.parse(link, true);
        return !urlObject.protocol;
      });
    return [...acc, ...links];
  }, []);
};

const replaseUrlsWithLocalPath = data => data;

export default (request, output = '.') => {
  const filename = path.resolve(output, buildPathNameFromUrl(request));
  const foldername = path.resolve(output, buildPathNameFromUrl(request, '_files'));

  return fs.mkdir(foldername)
    .then(() => axios.get(request))
    .then((response) => {
      const localUrls = getLocalUrls(response.data);
      console.log(localUrls);
      const newContent = replaseUrlsWithLocalPath(response.data);
      const rootPage = fs.writeFile(filename, newContent);
    });
};
