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
const { servePlugin } = require("./serve-plugin");
const { execSync } = require("child_process");

const pluginDirs = fs.readdirSync("./plugins");

const pluginOverrides = {};
let nextPort = 8000;

for (const pluginDir of pluginDirs) {
    pluginOverrides[pluginDir] = {
        portNo: nextPort,
    };

    servePlugin(pluginDir, nextPort);
    ++nextPort;
}

const pluginsFile = `./src/testbed/services/plugins/plugins.json`;
fs.writeFileSync(pluginsFile, JSON.stringify(pluginOverrides, null, 4));
console.log(`Wrote plugins file ${pluginsFile}`);