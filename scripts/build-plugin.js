//
// This script builds a single plugin and copies it output to the `plugins` subdirectory.
// 
// To build a single plugin:
//
//   node ./scripts/build-plugin.js <plugin-name>
//
// Example:
//
//   node ./scripts/build-plugin.js text
//
//
// Under the hood, runs this command:
//
//   pnpm -r --filter <plugin-name> run build
//
// Example:
//
//   pnpm -r --filter text run build
//

const minimist = require('minimist');
const fs = require("fs-extra");
const path = require("path");
const { exec } = require("child_process");

//
// Builds a named plugiun.
//
async function buildPlugin(pluginName, pluginsDir, outputDir) {

    await fs.ensureDir(outputDir);
    
    console.log(`Building plugin "${pluginName}"...`);
    
    //TODO: Only build if any file is later than the output.
    
    try {
        const buildCmd = `pnpm -r --filter ${pluginName} run build`;
        const result = await exec(buildCmd);
        // console.log(result.toString());
    }
    catch (err) {
        console.error(`Failed with code ${err.status}`);
        console.error(err.output.toString());
        process.exit(1);
    }
    console.log(`Built plugin "${pluginName}".`);
    
    const contentFile = path.join(pluginsDir, `${pluginName}/out/index.html`);
    const outputContentFile = path.join(outputDir, `${pluginName}.txt`);
    await fs.copyFile(contentFile, outputContentFile);
    console.log(`Copied ${contentFile} ->  ${outputContentFile}`);
    
    const pluginConfigFile = path.join(pluginsDir, `${pluginName}/plugin.json`);
    const outputPluginConfig = path.join(outputDir, `${pluginName}.json`);
    await fs.copyFile(pluginConfigFile, outputPluginConfig);
    console.log(`Copied ${pluginConfigFile} ->  ${outputPluginConfig}`);
}

if (require.main === module) {
    const argv = minimist(process.argv.slice(2));
    if (argv._.length !== 1) {
        console.log(`Usage: node ./scripts/build-plugin.js <plugin-name>`);
        process.exit(1);
    }

    const pluginName = argv._[0];
    const projectDir = path.dirname(__dirname);
    const pluginsDir = path.join(projectDir, "plugins");
    const outputDir = path.join(projectDir, "src/testbed/services/plugins");
    buildPlugin(pluginName, pluginsDir, outputDir)
        .catch(err => {
            console.error(`Failed to build plugin ${pluginName}.`);
            console.error(err);
            process.exit(1);
        });
}
else {
    module.exports = {
        buildPlugin,
    };
}

