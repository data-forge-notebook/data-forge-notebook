//
// Generates projects for a particular language.
//

export interface ILanguageProjectGenerator {

    //
    // Ensure that a project exists for a notebook.
    //
    ensureProject(forExport: boolean): Promise<void>;

    //
    // Install default module for a project.
    //
    installDefaultModules(forExport: boolean): Promise<void>;

}
