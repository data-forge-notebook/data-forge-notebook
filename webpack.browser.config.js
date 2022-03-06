const webpackConfig = require('./webpack.base.config');

module.exports = webpackConfig("browser");

console.log(`Browser webpack config:`);
console.log(module.exports);