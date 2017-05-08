import axios from 'axios';
import path from 'path';
import url from 'url';
import fs from 'mz/fs';

const buildFilenameFromUrl = (request) => {
  const urlObject = url.parse(request, true);
  return `${[urlObject.host, urlObject.path]
    .join('')
    .replace(/\W+/g, '-')}.html`;
};

const loadpage = (request, output = './') => {
  const filename = path.resolve(output, buildFilenameFromUrl(request));

  return axios.get(request)
    .then(response => fs.writeFile(filename, response.data));
};

export default loadpage;
