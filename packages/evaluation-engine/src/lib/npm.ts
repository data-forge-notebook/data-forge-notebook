import { ILog } from "utils";
import * as path from 'path';
import * as fs from 'fs-extra';
import * as _ from "lodash";
import { downloadPackage } from "./npm-package-downloader";

export const requireStmtRegex = () => /require\(('|")([^('|")]+?)('|")\)/gm;
export const importStmtRegex = () => /import .*?('|")([^('|")]+?)('|")/gm;

export interface IModuleSpec {
    name: string;
    version: string;
}

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
    installModules(modules: IModuleSpec[], projectPath: string, installExtras: boolean): Promise<void>;

    //
    // Ensure that a module is installed, only do the install if it's deemed not to exist already.
    //
    ensureModules(modules: IModuleSpec[], projectPath: string, force: boolean, installExtras: boolean): Promise<void>;

    //
    // Ensure that any npm peer dependencies required by the project are also installed.
    //
    ensurePeerDependenciesInstalled(packageName: string, projectPath: string): Promise<void>;

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
    // Installs a single module and all dependencies.
    //
    async installModule(module: IModuleSpec, projectPath: string, installExtras: boolean): Promise<void> {

        // console.log("Installing module: " + module.name);

        const installed = await downloadPackage(module.name, module.version, projectPath);
        if (!installed) {
            // Already installed.
            return;
        }

        const packagePath = path.join(projectPath, "node_modules", module.name, "package.json");
        const packageExists = await fs.pathExists(packagePath);
        if (!packageExists) {
            // Already installed, skip dependencies an everything else.
            return;
        }
        
        const packageFile = await fs.readJson(packagePath);
        const dependencies = Object.entries(packageFile.dependencies || {}).map(([name, version]) => ({ name, version: version as string }));
        await this.installModules(dependencies, projectPath, false);            

        if (installExtras) {            
            await Promise.all([
                this.ensurePeerDependenciesInstalled(packageFile, projectPath),
                this.installTypeDefs(module, projectPath),
            ]);
        }
    }

    //
    // Install a named module.
    //
    async installModules(modules: IModuleSpec[], projectPath: string, installExtras: boolean): Promise<void> {
        if (modules.length <= 0) {
            return;
        }
        
        await Promise.all(modules.map(module => this.installModule(module, projectPath, installExtras)));
    }

    //
    // Install the typedefs for a module.
    //
    private async installTypeDefs(module: IModuleSpec, projectPath: string) {
        await this.ensureModules([ { name: `@types/${module.name}`, version: "latest" } ], projectPath, false, false);
    }

    //
    // Ensure that a module is installed, only do the install if it's deemed not to exist already.
    //
    async ensureModules(modules: IModuleSpec[], projectPath: string, force: boolean, installExtras: boolean): Promise<void> {
        if (modules.length <= 0) {
            return;
        }

        await fs.ensureDir(projectPath);

        const nodeModulesPath = path.join(projectPath, "node_modules");
        await fs.ensureDir(nodeModulesPath);

        await this.installModules(modules, projectPath, installExtras);
    }

    //
    // Ensure that any npm peer dependencies required by the project are also installed.
    //
    async ensurePeerDependenciesInstalled(packageFile: any, projectPath: string): Promise<void> {

        // this.log.info("Installing peer dependencies for " + packageFile.name);

        const peerDependencies = packageFile.peerDependencies
        if (peerDependencies === undefined || peerDependencies.length <= 0) {
            return;
        }
        await this.ensureModules(peerDependencies, projectPath, false, true);
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
        await this.installModules(moduleNames.map(moduleName => ({ name: moduleName, version: "latest" })), projectPath, true);
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
