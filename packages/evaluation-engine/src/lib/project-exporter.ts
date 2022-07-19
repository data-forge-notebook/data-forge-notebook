import { ProjectGenerator } from "./project-generator";
import { ILog } from "utils";
import { INotebook } from "model";
import { CodeGenerator } from "./code-generator";
import * as path from 'path';
import * as fs from 'fs-extra';
import { INpm } from "./npm";

//
// Exports an existing project to Node.js.
//

export interface IProjectExporter {

    //
    // Export an entire project from the notebook.
    //
    exportProject(exportPath: string): Promise<void>;

}

export class ProjectExporter implements IProjectExporter {

    notebook: INotebook;

    log: ILog;

    npm: INpm;

    constructor(notebook: INotebook, npm: INpm, log: ILog) {
        this.notebook = notebook;
        this.npm = npm;
        this.log = log;
    }

    //
    // Export an entire project from the notebook.
    //
    async exportProject(exportPath: string): Promise<void> {

        await fs.ensureDir(exportPath);
        await fs.ensureDir(path.join(exportPath, "src"));

        const language = this.notebook.getLanguage();

        //
        // Create the exported project.
        //
        const projectGenerator = new ProjectGenerator(exportPath, language, this.npm, this.log);
        await projectGenerator.ensureProject(true);

        //
        // Generate code from the notebook.
        //
        const codeGenerator = new CodeGenerator(this.notebook, exportPath, this.log);
        const code = await codeGenerator.exportCode();
        
        //
        // Ensure that npm modules used in the code are installed in the exported project.
        //
        await this.npm.ensureRequiredModules(code, exportPath, false);

        const codeFileName = codeGenerator.formatFileName("index");
        const codeFilePath = path.join(exportPath, "src", codeFileName);
        await fs.writeFile(codeFilePath, code);
    }
}