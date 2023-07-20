//
// Packages the evaluation-engine for bundling into the Tauri shell installer.
//

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const fs = require("fs-extra");
const os = require("os");

async function execCmd(cmd, cwd, options) {
    try {
        console.log("$ " + cmd + " (cwd: " + cwd + ")");
        const { stdout, stderr } = await exec(cmd, { cwd });
        console.log(stdout);
        console.log(stderr);
        return true;
    } 
    catch (error) {
        if (options?.ignoreErrors) {
            return true;
        }

        console.error('Error occurred:', error);
        return false;
    }
}

async function main() {
    const destDir = "./shells/tauri/resources/evaluation-engine";

    if (fs.existsSync(destDir)) {
        console.log(`Removing previous build...`);
        fs.removeSync(destDir);
    }

    console.log(`Exporting evaluation engine to ${destDir}...`);

    //
    // Assume eval engine shell is built.
    // Export the project from the mono repo.
    // Note: Errors are ignored because 'pnpm deploy' has an EPERM error (code 1) on Windows, but the files are still copied.
    //
    await execCmd(`pnpm --filter=evaluation-engine-shell --prod --shamefully-hoist deploy --silent ${destDir}`, ".", { ignoreErrors: true });

    console.log(`Done`);
}

main()
    .catch(err => {
        console.error(`Failed:`);
        console.error(err);
    });
