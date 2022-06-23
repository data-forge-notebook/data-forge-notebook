import { InjectProperty, InjectableSingleton } from "@codecapers/fusion";
import * as path from "path";
import * as os from "os";
import { IFile, IFileId } from "./file";
import { INotebookRepository, INotebookRepositoryId, INotebookStorageId, IIdGenerator, IIdGeneratorId } from "notebook-editor";
import { IDialogs, IDialogsId } from "./dialogs";
import { ISerializedNotebook1 } from "notebook-editor/ts-build/model/serialization/serialized1";

//
// Identifies a notebook in storage.
//
export class NotebookStorageId implements INotebookStorageId { 

    //
    // The file name for the notebook or 'untitled' for new notebooks.
    //
    private fileName: string;

    //
    // The path that contains the notebook undefined for new notebooks that have never been saved.
    //
    private containingPath: string;

    //
    // Create a notebook storage ID from a full file path.
    //
    static fromFilePath(filePath: string): NotebookStorageId {
        return new NotebookStorageId(path.basename(filePath), path.dirname(filePath));
    }

    constructor(fileName: string, containingPath: string) {
        this.fileName = fileName;
        this.containingPath = containingPath;
    }

    //
    // Get the id as a path.
    //
    asPath(): string {
        return path.join(this.containingPath, this.fileName);
    }

    //
    // Get the file name for the notebook or 'untitled' for new notebooks.
    //
    getFileName(): string {
        return this.fileName;
    }

    //
    // Sets the filename.
    //
    setFileName(fileName: string): void {
        this.fileName = fileName;
    }
    
    //
    // Get the path that contains the notebook undefined for new notebooks that have never been saved.
    //
    getContainingPath(): string {
        return this.containingPath;
    }

    //
    // Sets the containing path for the notebook.
    //
    setContainingPath(path: string): void {
        this.containingPath = path;
    }

    //
    // Get the full path for this file.
    //
    getFullPath(): string {
        return path.join(this.getContainingPath(), this.getFileName());
    }
}

//
// Interface to a repository of notebooks. Used to load and save notebooks.
//
@InjectableSingleton(INotebookRepositoryId)
export class NotebookRepository implements INotebookRepository {

    @InjectProperty(IFileId)
    file!: IFile;

    @InjectProperty(IDialogsId)
    dialogs!: IDialogs;

    @InjectProperty(IIdGeneratorId)
    idGenerator!: IIdGenerator;

    //
    // Check if the requested notebook is already in storage.
    //
    async exists(notebookId: INotebookStorageId): Promise<boolean> {
        const id = notebookId as NotebookStorageId;
        return await this.file.exists(id.getFullPath());
    }

    //
    // Writes a notebook to storage.
    //
    async writeNotebook(notebook: ISerializedNotebook1, notebookId: INotebookStorageId): Promise<void> {
        const id = notebookId as NotebookStorageId;
        await this.file.writeJsonFile(id.getFullPath(), notebook);
    }

    //
    // Reads a notebook from storage.
    //
    async readNotebook(notebookId: INotebookStorageId): Promise<{ data: ISerializedNotebook1, readOnly: boolean }> {
        const id = notebookId as NotebookStorageId;
        const data = await this.file.readJsonFile(id.getFullPath());
        const readOnly = await this.file.isReadOnly(id.getFullPath());
        return { data, readOnly };
    }

    //
    // Makes the id for a new untititled notebook.
    //
    async makeUntitledNotebookId(): Promise<INotebookStorageId> {
        const tmpDir = path.join(os.tmpdir(), "dfntmp");
        const untitledProjectsPath = path.join(tmpDir, "untitled");
        const newUntitledProjectPath = path.join(untitledProjectsPath, this.idGenerator.genId());
        await this.file.ensureDir(newUntitledProjectPath);
        return new NotebookStorageId("untitled", newUntitledProjectPath);
    }

    //
    // Shows a dialog to allow the user to choose a notebook to open.
    //
    async showNotebookOpenDialog(openFilePath?: string, directoryPath?: string): Promise<INotebookStorageId | undefined> {
        const filePath = openFilePath ? openFilePath : await this.dialogs.showFileOpenDialog(directoryPath);
        if (!filePath) {
            // User cancelled.
            return undefined;
        }

        return NotebookStorageId.fromFilePath(filePath);
    }

    //
    // Shows a dialog to allow the user to save their notebook to a new location.
    //
    async showNotebookSaveAsDialog(existingNotebookId: INotebookStorageId | undefined, specifiedLocation?: string): Promise<INotebookStorageId | undefined> {
        const existingId = existingNotebookId as NotebookStorageId;
        const defaultPath = existingId ? existingId.getContainingPath() : undefined;
        const filePath = specifiedLocation || await this.dialogs.showFileSaveAsDialog("Save notebook", existingId.getFileName(), defaultPath, "Notebook file", "notebook");
        if (!filePath) {
            return undefined;
        }

        return NotebookStorageId.fromFilePath(filePath);
    }
    
}