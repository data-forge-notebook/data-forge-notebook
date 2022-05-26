//
// This script builds all plugins.
//
// To use:
//
//      pnpm run build-plugins
//
// Or
//
//      node ./scripts/build-plugins.js
//

const fs = require("fs-extra");
const { buildPlugin } = require("./build-plugin");
const { execSync } = require("child_process");

const pluginDirs = fs.readdirSync("./plugins");

for (const pluginDir of pluginDirs) {
    buildPlugin(pluginDir);
}

const pluginsFile = `./src/testbed/services/plugins/plugins.json`;
fs.writeFileSync(pluginsFile, JSON.stringify({}, null, 4));
console.log(`Wrote empty plugins file ${pluginsFile}`);