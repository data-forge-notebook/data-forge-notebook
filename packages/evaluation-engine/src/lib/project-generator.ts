import { ILog } from "utils";
import { ILanguageProjectGenerator } from "./language-project-generator";
import { JavaScriptProjectGenerator } from "./javascript-project-generator";
import { INpm } from "./npm";

//
// Generates projects conditional on the language.
//

export interface IProjectGenerator {

    //
    // Ensure that a project exists for a notebook.
    //
    ensureProject(forExport: boolean): Promise<void>;
}

//
// Factory function to create a project generator for a particular language.
//
export function createLanguageProjectGenerator(language: string, projectPath: string, npm: INpm, log: ILog): ILanguageProjectGenerator {
    if (language === "javascript") {
        return new JavaScriptProjectGenerator(projectPath, npm, log);
    }
    else {
        throw new Error(`Code generator doesn't support language ${language}.`);
    }
}

export class ProjectGenerator implements IProjectGenerator {

    // 
    // Project generator for the specific language.
    //
    languageProjectGenerator: ILanguageProjectGenerator;

    //
    // The specific language.
    //
    language: string;

    //
    // The path that contains the project.
    //
    projectPath: string;

    log: ILog;

    npm: INpm;

    constructor(projectPath: string, language: string, npm: INpm, log: ILog) {
        this.projectPath = projectPath;
        this.language = language;
        this.languageProjectGenerator = createLanguageProjectGenerator(language, projectPath, npm, log);
        this.npm = npm;
        this.log = log;
    }

    //
    // Ensure that a project exists for a notebook.
    //
    async ensureProject(forExport: boolean): Promise<void> {
        await this.languageProjectGenerator.ensureProject(forExport);
        await this.languageProjectGenerator.installDefaultModules(forExport);
    }
}