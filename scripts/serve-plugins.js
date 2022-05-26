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

console.log(`Compiling sub projects...`);
try {
    const result = execSync(`pnpm -r run compile`);
    // console.log(result.toString());
}
catch (err) {
    console.error(`Failed with code ${err.status}`);
    console.error(err.output.toString());
    process.exit(1);
}
console.log(`Compiled sub projects.`);

const pluginDirs = fs.readdirSync("./plugins");

const pluginOverrides = {};
let nextPort = 8000;

for (const pluginDir of pluginDirs) {
    pluginOverrides[pluginDir] = {
        portNo: nextPort,
    };

    servePlugin(pluginDir, nextPort);
}

const pluginsFile = `./src/testbed/services/plugins/plugins.json`;
fs.writeFileSync(pluginsFile, JSON.stringify(pluginOverrides, null, 4));
console.log(`Wrote plugins file ${pluginsFile}`);