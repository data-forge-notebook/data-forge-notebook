//
// This script builds a single plugin and copies it output to the `plugins` subdirectory.
// 
// To buid a single plugin:
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
const { execSync } = require("child_process");

//
// Builds a named plugiun.
//
function buildPlugin(pluginName) {
    fs.ensureDirSync("./src/testbed/services/plugins");

    console.log(`Building plugin "${pluginName}"...`);
    
    //TODO: Only build if any file is later than the output.
    
    const buildCmd = `pnpm -r --filter ${pluginName} run build`;
    try {
        const result = execSync(buildCmd);
        // console.log(result.toString());
    }
    catch (err) {
        console.error(`Failed with code ${err.status}`);
        console.error(err.output.toString());
        process.exit(1);
    }
    console.log(`Built plugin "${pluginName}".`);
    
    const contentFile = `./plugins/${pluginName}/out/index.html`;
    const outputContentFile = `./src/testbed/services/plugins/${pluginName}.txt`;
    fs.copyFileSync(contentFile, outputContentFile);
    console.log(`Copied ${contentFile} ->  ${outputContentFile}`);
    
    const pluginConfigFile = `./plugins/${pluginName}/plugin.json`;
    const outputPluginConfig = `./src/testbed/services/plugins/${pluginName}.json`;
    fs.copyFileSync(pluginConfigFile, outputPluginConfig);
    console.log(`Copied ${pluginConfigFile} ->  ${outputPluginConfig}`);
}

if (require.main === module) {
    const argv = minimist(process.argv.slice(2));
    if (argv._.length !== 1) {
        console.log(`Usage: node ./scripts/build-plugin.js <plugin-name>`);
        process.exit(1);
    }

    const pluginName = argv._[0];
    buildPlugin(pluginName);
}
else {
    module.exports = {
        buildPlugin,
    };
}

