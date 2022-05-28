//
// This script starts the dev server for single plugin and copies the plugin config to the `plugins` subdirectory.
// 
// To server a single plugin:
//
//   node ./scripts/serve-plugin.js <plugin-name> <port-no>
//
// Example:
//
//   node ./scripts/serve-plugin.js text 9000
//
// Under the hood, runs this command:
//
//   pnpm -r --filter <plugin-name> run start:dev --port=<port>
//
// Example:
//
//   pnpm -r --filter text run start:dev --port=9000
//

const minimist = require('minimist');
const fs = require("fs-extra");
const { exec } = require("child_process");

//
// Servers a named plugiun.
//
function servePlugin(pluginName, portNo) {
    fs.ensureDirSync("./src/testbed/services/plugins");

    console.log(`Serving plugin "${pluginName}" on port ${portNo}...`);

    const pluginConfigFile = `./plugins/${pluginName}/plugin.json`;
    const outputPluginConfig = `./src/testbed/services/plugins/${pluginName}.json`;
    fs.copyFileSync(pluginConfigFile, outputPluginConfig);
    console.log(`Copied ${pluginConfigFile} ->  ${outputPluginConfig}`);

    try {
        const serveCmd = `pnpm -r --filter ${pluginName} run start:dev --port=${portNo}`;
        exec(serveCmd, (err, stdout, stderr) => {
            console.log(`Serving plugin finished.`);
            console.log(`== STDOUT ==`);
            console.log(stdout);
            console.log(`== STDERR ==`);
            console.log(stderr);

            if (err) {
                console.error(`== Serving plugin ${pluginName} failed with code ${err.status} ==`);
                console.error(err);
                process.exit(1);
            }
        });
    }
    catch (err) {
        console.error(`Failed with error:`);
        console.error(err);
        process.exit(1);
    }
}

if (require.main === module) {
    const argv = minimist(process.argv.slice(2));
    if (argv._.length !== 2) {
        console.log(`Usage: node ./scripts/serve-plugin.js <plugin-name> <port>`);
        process.exit(1);
    }

    const pluginName = argv._[0];
    const portNo = parseInt(argv._[1]);
    servePlugin(pluginName, portNo);
}
else {
    module.exports = {
        servePlugin: servePlugin,
    };
}

