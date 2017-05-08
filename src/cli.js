import program from 'commander';
import loadpage from './loadpage';

export default () => {
  program
    .version('0.0.1')
    .description('Downloads the page from the given url and puts it in the specified folder.')
    .option('-o, --output [dir]', 'Output directory')
    .arguments('<url>')
    .action((url, options) => {
      loadpage(url, options.output);
    });

  program.parse(process.argv);
};
