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
const path = require("path");
const { buildPlugin } = require("./build-plugin");

async function main () {
    const outputDir = process.env.PLUGINS_OUTPUT;
    if (!outputDir) {
        throw new Error(`Plugins output directory not set through environment variable PLUGINS_OUTPUT.`);
    }

    const projectDir = path.dirname(__dirname);
    const pluginsDir = path.join(projectDir, "plugins");
    const plugins = await fs.readdir(pluginsDir);
    const buildPlugins = plugins.map(pluginDir => buildPlugin(pluginDir, pluginsDir, outputDir));
    await Promise.all(buildPlugins);
    
    const pluginsFile = path.join(outputDir, `plugins.json`);
    await fs.writeFile(pluginsFile, JSON.stringify({}, null, 4));
    console.log(`Wrote empty plugins file ${pluginsFile}`);
}

main()
    .catch(err => {
        console.error(`Failed to build plugins.`);
        console.error(err);
        process.exit(1);
    });