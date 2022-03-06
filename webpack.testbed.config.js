const webpackConfig = require('./webpack.base.config');

module.exports = webpackConfig("testbed");

console.log(`Testbed webpack config:`);
console.log(module.exports);