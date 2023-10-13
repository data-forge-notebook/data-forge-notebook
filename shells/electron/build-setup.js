//
// Setup the build directory.
//

const fs = require('fs-extra');
const axios = require('axios');
const { spawn, execSync } = require('child_process');
const { hoist } = require('hoist-modules');
const path = require('path');

const BUILD_PARENT_DIR = process.env.BUILD_PARENT_DIR;
if (!BUILD_PARENT_DIR) {
    throw new Error("BUILD_PARENT_DIR environment variable not set.");
}

const PLATFORM = process.env.PLATFORM;
if (!PLATFORM) {
    throw new Error("PLATFORM environment variable not set.");
}

async function main() {
    console.log(`Building for platform: ${PLATFORM}`);

    const rootBuildDir = `${BUILD_PARENT_DIR}/dfn-build`;
    fs.ensureDirSync(rootBuildDir);

    const cacheDir = `${rootBuildDir}/cache`;
    fs.ensureDirSync(cacheDir);

    const buildDir = `${rootBuildDir}/build`;
    fs.removeSync(buildDir);
    fs.ensureDirSync(buildDir);

    //
    // Package.json.
    //
    const package = JSON.parse(fs.readFileSync(`package.json`, 'utf8'));
    package.name = "data-forge-notebook-v2"; // Have to change the name so that DFN is installed to the right directory!

    const sha = process.env.GIT_SHA;
    if (sha) {
        package.version = `2.0.${sha.substring(0, 6)}`;
    }
    fs.writeFileSync(`${buildDir}/package.json`, JSON.stringify(package, null, 2));

    //
    // Copy files.
    //
    fs.copySync('build', `${buildDir}/build`);
    fs.copySync('dist', `${buildDir}/dist`);
    fs.copySync(`../../notebooks`, `${buildDir}/notebooks`);

    //
    // Copy and hoist node-modules.
    //
    await hoist("./", `${buildDir}/node_modules`, { devDependencies: true });

    //
    // Package the evaluation engine.
    //
    const evaluationEngineDir = `${buildDir}/evaluation-engine`;
    fs.ensureDirSync(evaluationEngineDir);
    fs.copyFileSync(`../evaluation-engine/package.json`, `${evaluationEngineDir}/package.json`);
    fs.copySync(`../evaluation-engine/build`, `${evaluationEngineDir}/build`);
    await hoist(`../evaluation-engine`, `${evaluationEngineDir}/node_modules`);

    let nodejsInstallBasename;
    let nodejsInstallFile;
    const nodejsVersion = "18.17.1";
    if (PLATFORM === "win") {
        nodejsInstallBasename = `node-v${nodejsVersion}-win-x64`;
        nodejsInstallFile = `${nodejsInstallBasename}.zip`;
    }
    else if (PLATFORM === "mac") {
        nodejsInstallBasename = `node-v${nodejsVersion}-darwin-x64`;
        nodejsInstallFile = `${nodejsInstallBasename}.tar.gz`;
    }
    else if (PLATFORM === "linx") {
        nodejsInstallBasename = `node-v${nodejsVersion}-linux-x64`;
        nodejsInstallFile = `${nodejsInstallBasename}.tar.xz`;
    }

    const nodeJsUnpackDir = `${cacheDir}/${nodejsInstallBasename}`;
    if (!fs.existsSync(nodeJsUnpackDir)) {
        //
        // Download Node.js
        //
        const nodejsDownloadPath = `${cacheDir}/${nodejsInstallFile}`;
        if (!fs.existsSync(nodejsDownloadPath)) {
            const nodejs_install_url = `https://nodejs.org/dist/v${nodejsVersion}/${nodejsInstallFile}`;
            console.log(`Downloading Node.js from ${nodejs_install_url}`); 
            const response = await axios.get(nodejs_install_url, { responseType: "stream" });
            await downloadStreamToFile(response.data, nodejsDownloadPath);
        }
    
        //
        // Unpack Node.js.
        //
        console.log(`Unpacking Node.js from ${nodejsDownloadPath}`);
        if (PLATFORM === "mac") {
            await runCmd("tar", ["-zxf", nodejsDownloadPath, "-C", cacheDir]);
        }
        else if (PLATFORM === "win") {
            await runCmd("unzip", ["-oq", nodejsDownloadPath, "-d", cacheDir]);
        }
        else if (PLATFORM === "linux") {
            await runCmd("tar", ["xf", nodejsDownloadPath, "-C", cacheDir]);
        }
    }

    await fs.copySync(nodeJsUnpackDir, `${buildDir}/nodejs`);
}

//
// Download a stream to a local file.
//
function downloadStreamToFile(incomingStream, filePath) {
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        incomingStream.pipe(writer);
        writer.on('error', err => {
            writer.close();
            reject(err);
        });
        writer.on('close', () => {
            resolve();
        });
    });
};

//
// Runs a command.
//
function runCmd(command, args, options) {

    if (!args) {
        args = [];
    }
    
    options = options || {};

    console.log("Running cmd: " + command + " " + args.join(' '));

    return new Promise((resolve, reject) => {

        var stdout = '';
        var stderr = ''

        var cp = spawn(command, args, options);

        cp.stdout.on('data', (data) => {
            var str = data.toString();
            console.log(command + ':out: ' + str);
            stdout += str;
        });

        cp.stderr.on('data', (data) => {
            var str = data.toString();
            console.log(command + ':err: ' + str);
            stderr += str;
        });

        cp.on('error', (err) => {
            console.log("Command failed: " + err.message);

            reject(err);
        });

        cp.on('exit', (code) => {
            console.log('Command exited with code ' + code);

            if (code === 0 || options.dontFailOnError) {
                resolve({
                    code: code,
                    stdout: stdout,
                    stderr: stderr,
                });
                return;
            }

            var err = new Error('Command failed with code ' + code);
            err.code = code;
            reject(err);
        });
    });
}

//
// Runs a command.
// TODO: Should use this instead of `runCmd`.
//
function exec(cmd) {
    try {
        const output = execSync(cmd);
        return { stdout: output.toString() };
    }
    catch (err) {
        return {
            err,
            stderr: err.stderr.toString(),
        };
    }
}

main()
    .catch(err => {
        console.error(`Build setup failed.`);
        console.error(err);
    });


