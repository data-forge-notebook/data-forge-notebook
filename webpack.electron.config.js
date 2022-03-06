const webpackConfig = require('./webpack.base.config');

module.exports = webpackConfig("electron");

console.log(`Electron webpack config:`);
console.log(module.exports);