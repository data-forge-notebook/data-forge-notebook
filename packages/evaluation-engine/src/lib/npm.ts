import { ILog } from "utils";
import * as path from 'path';
import * as fs from 'fs-extra';
import * as _ from "lodash";

export const requireStmtRegex = () => /require\(('|")([^('|")]+?)('|")\)/gm;
export const importStmtRegex = () => /import .*?('|")([^('|")]+?)('|")/gm;

//
// Determine if a line of code contains a module import statement.
//
export function isModuleImportStatement(line: string): boolean {
    return importStmtRegex().test(line); 
}

//
// Interface for code module installation.
//
export interface INpm   {


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
    // Install a named module.
    //
    async installModules(moduleNames: string[], projectPath: string, saveDev: boolean, noBinLinks: boolean, installExtras: boolean): Promise<void> {
        if (moduleNames.length <= 0) {
            return;
        }

        //TODO: Install required modules.

        if (installExtras) {
            await this.installPeerDeps(moduleNames, projectPath, saveDev, noBinLinks);
            await this.installTypeDefs(moduleNames, projectPath);
        }
    }

    private async installTypeDefs(moduleNames: string[], projectPath: string) {
        const typeDefModules = moduleNames.map(moduleName => `@types/${moduleName}`);
        const filteredTypeDefModules = await this.filterExistingModules(typeDefModules);
        if (filteredTypeDefModules.length > 0) {
            await this.ensureModules(filteredTypeDefModules, projectPath, false, true, false, false);
        }
    }

    private async installPeerDeps(moduleNames: string[], projectPath: string, saveDev: boolean, noBinLinks: boolean) {
        for (const moduleName of moduleNames) {
            await this.ensurePeerDependenciesInstalled(moduleName, projectPath, saveDev, noBinLinks);
        }
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

        //TODO: Filter out modules that don't exist.
        // const modulesExist = await Promise.all(moduleNames.map(moduleName => this.moduleExists(moduleName)));
        // return moduleNames.filter((moduleName, index) => modulesExist[index]);

        return moduleNames;
    }

    //
    // Get peer dependencies for the particular package.
    //
    async getPeerDependencies(packageName: string): Promise<string[]> {
        // TODO. Need to read local package.json.
        // const peerDeps = (await this.getLatestVersionPackageData(packageName)).peerDependencies;
        // if (!peerDeps) {
        //     return [];
        // }
        
        // return Object.keys(peerDeps);

        return [];
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
