//
// Setup the build directory.
//

const fs = require('fs-extra');
const { hoist } = require('hoist-modules');

const BUILD_PARENT_DIR = process.env.BUILD_PARENT_DIR;
if (!BUILD_PARENT_DIR) {
    throw new Error("BUILD_PARENT_DIR environment variable not set.");
}

async function main() {
    const buildDir = `${BUILD_PARENT_DIR}/dfn-build`;
    
    fs.removeSync(buildDir);
    fs.ensureDirSync(buildDir);
    
    fs.copySync('package.json', `${buildDir}/package.json`);
    fs.copySync('build', `${buildDir}/build`);
    fs.copySync('dist', `${buildDir}/dist`);
    fs.copySync('./build-hook-before-build.js', `${buildDir}/build-hook-before-build.js`);

    await hoist("./node_modules", `${buildDir}\\node_modules`);
}

main()
    .catch(err => {
        console.error(`Build setup failed.`);
        console.error(err);
    });


