import config from './rollup.config';
import uglify from 'rollup-plugin-uglify';

config.format = 'umd';
config.dest = 'dist/index.umd.js';
config.moduleName = 'rollupStarterProject';
config.plugins.push(uglify());

export default config;
