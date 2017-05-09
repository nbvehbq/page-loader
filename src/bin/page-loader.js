#!/usr/bin/env node

import program from 'commander';
import loadpage from '../';

program
  .version('0.0.1')
  .description('Downloads the page from the given url and puts it in the specified folder.')
  .option('-o, --output [dir]', 'Output directory')
  .arguments('<url>')
  .action((url, options) => {
    loadpage(url, options.output)
      .then(() => console.log('Download complited'))
      .catch(err => console.log(err.message));
  });

program.parse(process.argv);
