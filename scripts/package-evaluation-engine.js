//
// Packages the evaluation-engine for bundling into the Tauri shell installer.
//

const fs = require("fs-extra");

if (fs.existsSync("./shells/tauri/resources/evaluation-engine")) {
    fs.removeSync("./shells/tauri/resources/evaluation-engine");
}

fs.ensureDirSync("./shells/tauri/resources/evaluation-engine");
fs.copySync("./shells/evaluation-engine/build", "./shells/tauri/resources/evaluation-engine/build");
fs.copySync("./shells/evaluation-engine/package.json", "./shells/tauri/resources/evaluation-engine/package.json");

copyNodeModulesRecursive("./shells/evaluation-engine/node_modules", "./shells/tauri/resources/evaluation-engine/node_modules", "./shells/tauri/resources/evaluation-engine/node_modules");

//
// Walk a directory and copy files (synchronously).
//
function copyNodeModulesRecursive(from, to, rootPath) {
    const items = fs.readdirSync(from);

    for (const item of items) {
        const fromPath = from + "/" + item;
        const toPath = to + "/" + item;
        if (item === ".bin" 
            || item === "@types"
            || item === ".vscode") {
            continue;
        }
        else if (item === "node_modules") {
            // Flattens nested node modules.
            copyNodeModulesRecursive(fromPath, rootPath, rootPath);
        }
        else if (fs.statSync(fromPath).isDirectory()) {
            if (!fs.existsSync(toPath)) {
                copyNodeModulesRecursive(fromPath, toPath, rootPath);
            }
        }
        else {
            fs.copySync(fromPath, toPath, { overwrite: true });
        }
    }
}