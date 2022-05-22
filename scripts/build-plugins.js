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

for (const pluginDir of pluginDirs) {
    buildPlugin(pluginDir);
}

