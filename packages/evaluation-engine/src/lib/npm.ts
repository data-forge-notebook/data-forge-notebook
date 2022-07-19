import { ILog } from "utils";
import * as path from 'path';
import * as fs from 'fs-extra';
import { cmd } from './lib/cmd';
import axios from 'axios';
import * as _ from "lodash";
import * as os from "os";

const platform = os.platform();
const isWindows = platform === "win32";
const isMacOS = platform === "darwin";
const isLinux = platform === "linux";

export const requireStmtRegex = () => /require\(('|")([^('|")]+?)('|")\)/gm;
export const importStmtRegex = () => /import .*?('|")([^('|")]+?)('|")/gm;

//
// Determine if a line of code contains a module import statement.
//
export function isModuleImportStatement(line: string): boolean {
    return importStmtRegex().test(line); 
}

//
// Determine if a npm module exists.
// Derived from this https://github.com/parro-it/npm-exists
//
async function npmExists(moduleName: string): Promise<boolean> {
	const hostname = `https://registry.npmjs.org/`; //TODO: This could be moved to configuration.
    const pkgUrl = `${hostname}/${moduleName}`;
    try {
        const response = await axios.get(pkgUrl, {method: 'HEAD'});
        return response && response.status === 200;
    }
    catch (err) {
        return false;
    }
}

//
// Interface for code module installation.
//
export interface INpm   {

    //
    // Get the path to the Node.js exe.
    //
    getNodeJsExePath(): string;    

    //
    // Run a general npm install in the specified path.
    //
    generalNpmInstall(projectPath: string, noBinLinks: boolean): Promise<void>;
    
    //
    // Log the NPM version no.
    //
    logVersion(): Promise<void>;

    //
    // Returns true if the requested module exists in npm.
    //
    moduleExists(moduleName: string): Promise<boolean>;

    //
    // Install a named module.
    //
    installModules(moduleName: string[], projectPath: string, saveDev: boolean, noBinLinks: boolean, installExtras: boolean): Promise<void>;

    //
    // Ensure that a module is installed, only do the install if it's deemed not to exist already.
    //
    ensureModules(moduleName: string[], projectPath: string, force: boolean, saveDev: boolean, noBinLinks: boolean, installExtras: boolean): Promise<void>;

    //
    // Filter out modules that are already installed.
    //
    filterOutInstalledModules(moduleNames: string[], projectPath: string): Promise<string[]>;

    //
    // Filter out modules that don't exist on npm.
    //
    filterExistingModules(moduleNames: string[]): Promise<string[]>;

    //
    // Install a named package.
    //
    uninstallPackage(packageName: string, projectPath: string, removeExtras: boolean): Promise<void>;

    //
    // Ensure that any npm peer dependencies required by the project are also installed.
    //
    ensurePeerDependenciesInstalled(packageName: string, projectPath: string, saveDev: boolean, noBinLinks: boolean): Promise<void>;

    //
    // Find modules loaded through require statements in the code.
    //
    findModules(code: string, moduleImportRegex: RegExp): string[];

    //
    // Determine the modules required by the specified code.
    //
    scanCodeForRequiredModules(code: string, projectPath: string, onlyExistingModules: boolean): Promise<string[]>;
    
    //
    // Ensure modules required by the code are installed.
    //
    ensureRequiredModules(code: string, projectPath: string, onlyExistingModules: boolean): Promise<void>;

    //
    // List packages
    //
    listPackages(projectPath: string): Promise<any[]>;

    //
    // Search available packages.
    //
    searchPackages(searchText: string): Promise<any[]>;
}

//
// Helper for code module installation.
//
export class Npm implements INpm {

    log: ILog;

    //
    // Path to the Node.js install.
    //
    nodeJsPath: string;

    //
    // Path to the npm cache.
    //
    npmCachePath: string;

    constructor(nodeJsPath: string, npmCachePath: string, log: ILog) {
        this.nodeJsPath = nodeJsPath;
        this.npmCachePath = npmCachePath;
        this.log = log;
    }

    //
    // Get the path to the npm command or script.
    //
    private getNpmScriptPath(): string {
        return path.join(
            this.nodeJsPath, 
            (isLinux || isMacOS)
                ? "lib/node_modules/npm/bin/npm-cli.js" 
                : "node_modules/npm/bin/npm-cli.js"
        );        
    }

    //
    // Get the path to the Node.js exe.
    //
    getNodeJsExePath(): string {
        return path.join(this.nodeJsPath, (isLinux || isMacOS) ? "bin/node" : "node");
    }

    //
    // Invoke an Npm command (cross-platform).
    //
    private async invokeNpm(workingDirectory: string | undefined, args: string[], captureOutput? :boolean, checkErrorCode?: (code: number) => boolean): Promise<string | undefined> {

        const nodeExePath = this.getNodeJsExePath();
        const nodePath = path.dirname(nodeExePath);

        this.log.info("Running npm.");
        this.log.info("Using Nodejs from path " + nodePath);

        let cmdPath = nodePath;

        if (process.env.PATH) {
            cmdPath += path.delimiter + process.env.PATH;
        }

        const env = Object.assign({}, process.env, {
            PATH: cmdPath, // Override path.
        });

        //
        // Delete NODE_ENV, because leaving it set to "production"
        // disables dev dependencies and breaks TypeScript notebooks (because TypeScript doesn't get installed).
        //
        delete env.NODE_ENV;

        const npmScriptPath = this.getNpmScriptPath();
        let fullArgs = [
            npmScriptPath,
            ...args,
            //
            // Enables extra logging from npm.
            //
            //"--loglevel", "verbose",
            "--scripts-prepend-node-path", "true", 
            "--cache", this.npmCachePath,
            "--prefer-offline",
            "--no-audit",
        ];

        /* Haven't really needed this.
        if (disablePostInstall) {
            fullArgs = fullArgs.concat(["--ignore-scripts"]); // Prevents Electron being installed under Nightmare.
        }
        */

        const output = await cmd(
            {
                cmd: nodeExePath,
                args: fullArgs,
                cwd: workingDirectory, 
                env: env,
                captureOutput: captureOutput,
                captureErrors: true,
                checkErrorCode: checkErrorCode,
            },
            this.log
        );

        this.log.info("Command:");
        this.log.info([nodeExePath].concat(fullArgs).join(" "));

        return output;
    }

    //
    // Run a general npm install in the specified path.
    //
    async generalNpmInstall(projectPath: string, noBinLinks: boolean): Promise<void> {
        const args = ["install"];
        if (noBinLinks) {
            args.push("--bin-links");
            args.push("false");
        }
        await this.invokeNpm(projectPath, args);
    }
    
    //
    // Log the NPM version no.
    //
    async logVersion(): Promise<void> {
        this.log.info("Nodejs version is: ");
        const nodeExePath = this.getNodeJsExePath();
        const nodePath = path.dirname(nodeExePath);

        let cmdPath = nodePath; 

        if (process.env.PATH) {
            cmdPath += path.delimiter + process.env.PATH;
        }

        const env = Object.assign({}, process.env, {
            PATH: cmdPath, // Override path.
        });

        await cmd(
            {
                cmd: nodeExePath,
                args: ["--version"],
                env: env,
                captureErrors: true,
            },
            this.log
        );

        this.log.info("Npm version is: ");
        await this.invokeNpm("./", ["--version"]);
    }

    //
    // Returns true if the requested module exists in npm.
    //
    async moduleExists(moduleName: string): Promise<boolean> {
        return await npmExists(moduleName);
    }

    //
    // Install a named module.
    //
    async installModules(moduleNames: string[], projectPath: string, saveDev: boolean, noBinLinks: boolean, installExtras: boolean): Promise<void> {
        if (moduleNames.length <= 0) {
            return;
        }

        const args = ["install", saveDev ? "--save-dev" : "--save"].concat(moduleNames);
        if (noBinLinks) {
            args.push("--bin-links");
            args.push("false");
        }

        const installs: Promise<void | string | undefined>[] = [];
        
        installs.push(this.invokeNpm(projectPath, args));

        if (installExtras) {
            installs.push(this.installPeerDeps(moduleNames, projectPath, saveDev, noBinLinks));
            installs.push(this.installTypeDefs(moduleNames, projectPath));
        }

        await Promise.all(installs);
    }

    private async installTypeDefs(moduleNames: string[], projectPath: string) {
        const typeDefModules = moduleNames.map(moduleName => `@types/${moduleName}`);
        const filteredTypeDefModules = await this.filterExistingModules(typeDefModules);
        if (filteredTypeDefModules.length > 0) {
            await this.ensureModules(filteredTypeDefModules, projectPath, false, true, false, false);
        }
    }

    private async installPeerDeps(moduleNames: string[], projectPath: string, saveDev: boolean, noBinLinks: boolean) {
        await Promise.all(
            moduleNames.map(moduleName => this.ensurePeerDependenciesInstalled(moduleName, projectPath, saveDev, noBinLinks))
        );
    }

    //
    // Filter out modules that are already installed.
    //
    async filterOutInstalledModules(moduleNames: string[], projectPath: string): Promise<string[]> {
        if (moduleNames.length <= 0) {
            return [];
        }

        const nodeModulesPath = path.join(projectPath, "node_modules");
        const modulesInstalled = await Promise.all(
            moduleNames.map(
                async moduleName => {
                    const modulePath = path.join(nodeModulesPath, moduleName);
                    const moduleExists = await fs.pathExists(modulePath);
                    return moduleExists;
                }
            )
        );
        
        const filteredModuleList = moduleNames.filter((moduleName, index) => !modulesInstalled[index]);
        return filteredModuleList;
    }

    //
    // Ensure that a module is installed, only do the install if it's deemed not to exist already.
    //
    async ensureModules(moduleNames: string[], projectPath: string, force: boolean, saveDev: boolean, noBinLinks: boolean, installExtras: boolean): Promise<void> {
        if (moduleNames.length <= 0) {
            return;
        }

        await fs.ensureDir(projectPath);

        const nodeModulesPath = path.join(projectPath, "node_modules");
        await fs.ensureDir(nodeModulesPath);

        const filteredModules = force ? moduleNames : await this.filterOutInstalledModules(moduleNames, projectPath);
        if (filteredModules.length <= 0) {
            return;
        }
        await this.installModules(filteredModules, projectPath, saveDev, noBinLinks, installExtras);
    }

    //
    // Filter out modules that don't exist on npm.
    //
    async filterExistingModules(moduleNames: string[]): Promise<string[]> {
        if (moduleNames.length <= 0) {
            return [];
        }

        const modulesExist = await Promise.all(moduleNames.map(moduleName => this.moduleExists(moduleName)));
        return moduleNames.filter((moduleName, index) => modulesExist[index]);
    }

    //
    // Install a named package.
    //
    async uninstallPackage(packageName: string, projectPath: string, removeExtras: boolean): Promise<void> {

        const args = [
            "uninstall",
            packageName
        ];

        await this.invokeNpm(projectPath, args);

        if (removeExtras) {
            //
            // No need to uninstall peer dependencies.
            // They might be used by someting else!
            //

            const typeDefPackageName = `@types/${packageName}`;
            await this.uninstallPackage(typeDefPackageName, projectPath, false);
        }
    }

    //
    // Get the package file for the specified npm package.
    //
    async getPackageData(packageName: string): Promise<any> {
        const encodedPackageName = encodeURIComponent(packageName);
        const registry = "https://registry.npmjs.com";
        const url = `${registry}/${encodedPackageName}`;
        const response = await axios.get(url);
        return response.data;
    }

    //
    // Get available version for the particular package.
    //
    async getAvailableVersions(packageName: string): Promise<string[]> {
        const packageData = await this.getPackageData(packageName);
        return Object.keys(packageData.versions);
    }

    //
    // Get package data for the latest version.
    //
    async getLatestVersionPackageData(packageName: string): Promise<any> {
        const packageData = await this.getPackageData(packageName);
        const versions = Object.keys(packageData.versions);
        const latestVersion = versions[versions.length-1];
        return packageData.versions[latestVersion];
    }

    //
    // Get peer dependencies for the particular package.
    //
    async getPeerDependencies(packageName: string): Promise<string[]> {
        const peerDeps = (await this.getLatestVersionPackageData(packageName)).peerDependencies;
        if (!peerDeps) {
            return [];
        }
        
        return Object.keys(peerDeps);
    }

    //
    // Ensure that any npm peer dependencies required by the project are also installed.
    //
    async ensurePeerDependenciesInstalled(packageName: string, projectPath: string, saveDev: boolean, noBinLinks: boolean): Promise<void> {

        this.log.info("Installing peer dependencies for " + packageName);

        const peerDependencies = await this.getPeerDependencies(packageName);
        if (peerDependencies.length <= 0) {
            return;
        }
        await this.ensureModules(peerDependencies, projectPath, false, saveDev, noBinLinks, true);
    }

    //
    // Find modules loaded through require statements in the code.
    //
    findModules(code: string, moduleImportRegex: RegExp): string[] {

        let match;
        const modules = [];

        while ((match = moduleImportRegex.exec(code)) !== null) {
            // This is necessary to avoid infinite loops with zero-width matches
            if (match.index === moduleImportRegex.lastIndex) {
                moduleImportRegex.lastIndex++;
            }

            if (match && match.length >= 3) {
                modules.push(match[2]);
            }
        }    

        return modules;
    }

    //
    // Determine the modules required by the specified code.
    //
    async scanCodeForRequiredModules(code: string, projectPath: string, onlyExistingModules: boolean): Promise<string[]> {
        const requiredModules = this.findModules(code, requireStmtRegex())
            .concat(this.findModules(code, importStmtRegex()));

        let npmRequiredModules = requiredModules.filter(moduleName => {
            if (moduleName.startsWith(".") ||
                moduleName.startsWith("/") ||
                moduleName.startsWith("\\")) {
                return false; // Filter out local modules.
            }
            return true;
        });

        // Remove duplicates.
        npmRequiredModules = _.uniq(npmRequiredModules);

        // Filter out builtin modules.
        npmRequiredModules = npmRequiredModules.filter(moduleName => builtinModules.indexOf(moduleName) < 0);

        // Filter out already installed modules.
        npmRequiredModules = await this.filterOutInstalledModules(npmRequiredModules, projectPath);

        if (onlyExistingModules) {
            // Filter out modules that don't exists on npm if requested.
            npmRequiredModules = await this.filterExistingModules(npmRequiredModules);
        }

        return npmRequiredModules;
    }

    //
    // Ensure modules required by the code are installed.
    //
    async ensureRequiredModules(code: string, projectPath: string, onlyExistingModules: boolean): Promise<void> {
        const moduleNames = await this.scanCodeForRequiredModules(code, projectPath, onlyExistingModules);
        if (moduleNames.length <= 0) {
            // Don't allow this because it can be displayed in a notebook.
            // this.log.info("No modules need to be installed.");
            return; // No modules used.
        }

        await fs.ensureDir(projectPath);

        this.log.info("Requesting installation of modules: " + moduleNames.join(', '));
        this.log.info("Project path: " + projectPath);

        await this.installModules(moduleNames, projectPath, false, false, true);
    }    

    //
    // List packages
    //
    async listPackages(projectPath: string): Promise<any[]> {
        const packageMap: any = {};
        const lsOutput = await this.invokeNpm(projectPath, ["ls", "--json", "--depth", "0", "--long"], true);
        if (lsOutput) {
            const packageInfo = JSON.parse(lsOutput);
            if (packageInfo.dependencies) {
                for (const key of Object.keys(packageInfo.dependencies)) {
                    packageMap[key] = {
                        name: key,
                        current: packageInfo.dependencies[key].version,
                        isDevDependency: false,
                    };
                }
            }

            if (packageInfo.devDependencies) {
                for (const key of Object.keys(packageInfo.devDependencies)) {
                    packageMap[key] = {
                        name: key,
                        current: packageInfo.devDependencies[key].version,
                        isDevDependency: true,
                    };
                }
            }
        }
        
        // npm outdated can return 1 to indicate there are outdated packages.
        const outdatedOutput = await this.invokeNpm(projectPath, ["outdated", "--json", "--depth", "0", "--long"], true, code => code === 0 || code === 1);
        if (outdatedOutput) {
            const outdatedInfo = JSON.parse(outdatedOutput);
            for (const key of Object.keys(outdatedInfo)) {
                packageMap[key] = {
                    name: key,
                    isDevDependency: outdatedInfo[key].type === "devDependency",
                    ...outdatedInfo[key],
                };
            }
        }

        return Object.keys(packageMap).map(key => packageMap[key]);
    }

    //
    // Search available packages.
    //
    async searchPackages(searchText: string): Promise<any[]> {
        const searchOutput = await this.invokeNpm("./", ["search", "--json", "--long", searchText], true);
        if (!searchOutput) {
            return [];
        }
        return JSON.parse(searchOutput);
    }
}

//
// List of builtin modules that shouldn't be npm installed.
//
const builtinModules = [ 
    "assert",
    "buffer",
    "child_process",
    "cluster",
    "crypto",
    "dgram",
    "dns",
    "domain",
    "events",
    "fs",
    "fs/promises",
    "http",
    "https",
    "net",
    "os",
    "path",
    "punycode",
    "querystring",
    "readline",
    "stream",
    "string_decoder",
    "timers",
    "tls",
    "tty",
    "url",
    "util",
    "v8",
    "vm",
    "zlib",
];
