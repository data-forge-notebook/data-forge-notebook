//
// This script builds all plugins.
//
// To use:
//
//      pnpm run serve-plugins
//
// Or
//
//      node ./scripts/serve-plugins.js
//

const fs = require("fs-extra");
const path = require("path");
const { servePlugin } = require("./serve-plugin");

const pluginDirs = fs.readdirSync("./plugins");

const projectDir = path.dirname(__dirname);
const outputDir = path.join(projectDir, `packages/plugins/data`);

console.log(`Writing plugins to ${outputDir}`);

const pluginOverrides = {};
let nextPort = 8000;

for (const pluginDir of pluginDirs) {
    pluginOverrides[pluginDir] = {
        portNo: nextPort,
    };

    servePlugin(pluginDir, nextPort, outputDir);
    ++nextPort;
}

const pluginsFile = path.join(outputDir, `plugins.json`);
fs.writeFileSync(pluginsFile, JSON.stringify(pluginOverrides, null, 4));
console.log(`Wrote plugins file ${pluginsFile}`);