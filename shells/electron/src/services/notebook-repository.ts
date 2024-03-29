import { InjectProperty, InjectableSingleton } from "@codecapers/fusion";
import * as path from "path";
import { IFile, IFileId } from "./file";
import { IIdGenerator, IIdGeneratorId } from "utils";
import { IDialogs, IDialogsId } from "./dialogs";
import { exampleNotebooks } from "../data/example-notebooks";
import { INotebookViewModel } from "notebook-editor/build/view-model/notebook";
import { IExampleNotebook, INotebookRepository, INotebookRepositoryId, INotebookStorageId } from "notebook-editor/build/services/notebook-repository";
import { IPaths, IPaths_ID } from "notebook-editor/build/services/paths";
import * as markdownSerialization from "notebook-editor/build/serialization/markdown/serialize";
import * as markdownDeserialization from "notebook-editor/build/serialization/markdown/deserialize";
import * as jsonDeserialization from "notebook-editor/build/serialization/json/deserialize";

//
// Identifies a notebook in storage.
//
export class NotebookStorageId implements INotebookStorageId { 

    //
    // The file name for the notebook or 'untitled' for new notebooks.
    //
    private fileName: string | undefined;

    //
    // The path that contains the notebook undefined for new notebooks that have never been saved.
    //
    private containingPath: string | undefined;

    //
    // Create a notebook storage ID from a full file path.
    //
    static fromFilePath(filePath: string): NotebookStorageId {
        const containingPath = path.dirname(filePath).replace(/\\/g, "/"); // Normalise the path for testing.
        return new NotebookStorageId(path.basename(filePath), containingPath);
    }

    constructor(fileName: string | undefined, containingPath: string | undefined) {
        this.fileName = fileName;
        this.containingPath = containingPath;
    }

    //
    // Get the display name of the file for the user.
    //
    displayName(): string {
        if (this.fileName === undefined) {
            return "untitled";
        }
        else if (this.containingPath === undefined) {
            return this.fileName;
        }
        else {
            return path.join(this.containingPath, this.fileName);
        }
    }

    //
    // Get the file name for the notebook or 'untitled' for new notebooks.
    //
    getFileName(): string | undefined {
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
    getContainingPath(): string | undefined {
        return this.containingPath;
    }

    //
    // Sets the containing path for the notebook.
    //
    setContainingPath(path: string): void {
        this.containingPath = path;
    }

    //
    // Gets the string representation of the id.
    //
    toString(): string | undefined { 
        if (this.containingPath && this.fileName) {
            return path.join(this.containingPath, this.fileName);
        }
        else {
            return this.fileName;
        }
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

    @InjectProperty(IPaths_ID)
    paths!: IPaths;

    //
    // Loads a storage id from a string.
    //
    idFromString(id: string): INotebookStorageId {
        return NotebookStorageId.fromFilePath(id);
    }

    //
    // Writes a notebook to storage.
    //
    async writeNotebook(notebook: INotebookViewModel, notebookId: INotebookStorageId): Promise<void> {
        const id = notebookId as NotebookStorageId;
        const fileName = id.getFileName();
        if (fileName === undefined) {
            throw new Error("Can't write notebook untitled notebook until the filename has been set in the notebook id.");
        }
        const containingPath = id.getContainingPath();
        if (containingPath === undefined) {
            throw new Error("Can't write notebook until the containing path has been set in the notebook id.");
        }
        const fullPath = path.join(containingPath, fileName);
        await this.file.writeFile(fullPath, markdownSerialization.serializeNotebook(notebook));
    }

    //
    // Reads a notebook from storage.
    //
    async readNotebook(notebookId: INotebookStorageId): Promise<INotebookViewModel> {
        const id = notebookId as NotebookStorageId;
        const fileName = id.getFileName();
        if (fileName === undefined) {
            throw new Error("Can't read notebook until the filename has been set in the notebook id.");
        }
        const containingPath = id.getContainingPath();
        if (containingPath === undefined) {
            throw new Error("Can't write notebook until the containing path has been set in the notebook id.");
        }
        const fullPath = path.join(containingPath, fileName);
        const readOnly = await this.file.isReadOnly(fullPath);
        const dataStr = await this.file.readFile(fullPath);
        if (dataStr.startsWith("{")) {
            // Assume a JSON notebook.
            return jsonDeserialization.deserializeNotebook(notebookId, false, readOnly, JSON.parse(dataStr));
        }
        else {
            // Assume a markdown notebook.
            return markdownDeserialization.deserializeNotebook(notebookId, false, readOnly, dataStr);
        }
    }

    //
    // Makes the id for a new untititled notebook.
    //
    makeUntitledNotebookId(): INotebookStorageId {
        return new NotebookStorageId(undefined, undefined);
    }

    //
    // Shows a dialog to allow the user to choose a notebook to open.
    //
    async showNotebookOpenDialog(directoryPath?: string): Promise<INotebookStorageId | undefined> {
        const filePath = await this.dialogs.showFileOpenDialog(directoryPath);
        if (!filePath) {
            // User cancelled.
            return undefined;
        }

        return NotebookStorageId.fromFilePath(filePath);
    }

    //
    // Shows a dialog to allow the user to save their notebook to a new location.
    //
    async showNotebookSaveAsDialog(existingNotebookId: INotebookStorageId): Promise<INotebookStorageId | undefined> {
        const existingId = existingNotebookId as NotebookStorageId;
        const fileName = existingId.getFileName();
        const containingPath = fileName !== undefined ? existingId.getContainingPath() : undefined;
        const filePath = await this.dialogs.showFileSaveAsDialog("Save notebook", existingId.getFileName() || "", containingPath, "Notebook file", "notebook");
        if (!filePath) {
            return undefined;
        }

        return NotebookStorageId.fromFilePath(filePath);
    }
    
    //
    // Gets the list of example notebooks.
    //
    // Technically this doesn't need to be an async function, but let's keep it that
    // way in case we want to load example notebooks from a database in the future.
    //
    async getExampleNotebooks(): Promise<IExampleNotebook[]> {
        const examplesPath = this.paths.getExamplesPath();
        return exampleNotebooks.map(example => {
            return {
                name: example.file,
                description: example.description,
                storageId: new NotebookStorageId(example.file, examplesPath),
            };
        });
    }
}