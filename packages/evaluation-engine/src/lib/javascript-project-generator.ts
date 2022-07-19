import { ILanguageProjectGenerator } from "./language-project-generator";
import { ILog } from "utils";
import * as path from 'path';
import * as fs from "fs-extra";
import { INpm } from "./npm";

//
// Generated babel configuration.
//    
const defaultBabelConfigFile = {
    presets: [
        [
            "@babel/preset-env",
            {
                "targets": {
                    "node": "10",
                },
            },
        ],
    ],
};

export async function writeJsonFile(filePath: string, data: any): Promise<void> {
    const jsonData = JSON.stringify(data, null, 4);
    await fs.writeFile(filePath, jsonData);
}

//
// Generates projects for JavaScript
//

export class JavaScriptProjectGenerator implements ILanguageProjectGenerator {
    
    //
    // The path where the project is being created.
    //
    projectPath: string;

    npm: INpm;

    log: ILog;

    constructor(projectPath: string, npm: INpm, log: ILog) {
        this.projectPath = projectPath;
        this.npm = npm;
        this.log = log;
    }

    //
    // Ensure that a project exists for a notebook.
    //
    async ensureProject(forExport: boolean): Promise<void> {
        const packagePath = path.join(this.projectPath, "package.json"); 
        const packageFileExists = await fs.pathExists(packagePath);
        if (forExport || !packageFileExists) {
            //
            // Generate package file.
            //
            const dirName = path.basename(this.projectPath).replace(/ /g, "_");
            const packageFile: any = {
                "name": dirName,
                "version": "1.0.0",
                "description": "Data-Forge Notebook - A JavaScript notebook",
            };

            if (forExport) {
                packageFile.main = "index.js";
                packageFile.scripts = {
                    "start": "babel-node src/index.js",
                    "build": "babel src --out-dir dist",
                };
            }
    
            await writeJsonFile(packagePath, packageFile);
        }
        else {
            const nodeModulesPath = path.join(this.projectPath, "node_modules");
            const nodeModulesExists = await fs.pathExists(nodeModulesPath);
            if (!nodeModulesExists) {
                // Don't enable this because it comes up in the evaluation.
                // this.log.info(`Node modules directory at ${nodeModulesExists} doesn't exist, doing a general npm install.`);

                //
                // Package file already exists but no node_modules, make sure all modules referenced are installed.
                //
                await this.npm.generalNpmInstall(this.projectPath, true);
            }
        }

        const babelConfigPath = path.join(this.projectPath, ".babelrc");
        if (forExport) {    
            await writeJsonFile(babelConfigPath, defaultBabelConfigFile);
        }
    }

    //
    // Install default module for a project.
    //
    async installDefaultModules(forExport: boolean): Promise<void> {

        if (forExport) {
            //
            // Install npm modules required by for Babel compilation.
            //
            const moduleNames = ["@babel/core", "@babel/preset-env"];

            moduleNames.push("@babel/node");
            moduleNames.push("@babel/cli");

            await this.npm.ensureModules(moduleNames, this.projectPath, forExport, true, false, false);
        }
    }
}
