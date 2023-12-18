import { INotebookViewModel } from "../view-model/notebook";

//
// Reference to an example notebook.
//
export interface IExampleNotebook {
    //
    // Name of the notebook.
    //
    name: string;

    // 
    // Description of the notebook.
    //
    description?: string;

    //
    // Storage ID for loading the notebook.
    //
    storageId: INotebookStorageId
}

//
// ID for the notebook repository service.
//
export const INotebookRepositoryId = "INotebookRepository";

//
// Identifies a notebook in storage.
//
export interface INotebookStorageId {

    //
    // Get the display name of the file for the user.
    //
    displayName(): string;

    //
    // Gets the containing path of the notebook (if known).
    //
    getContainingPath(): string | undefined;

    //
    // Get the string representation of the storage id.
    //
    toString(): string | undefined;
}

//
// Interface to a repository of notebooks. Used to load and save notebooks.
//
export interface INotebookRepository {

    //
    // Loads a storage id from a string.
    //
    idFromString(id: string): INotebookStorageId;

    //
    // Writes a notebook to storage.
    //
    writeNotebook(notebook: INotebookViewModel, notebookId: INotebookStorageId): Promise<void>;

    //
    // Reads a notebook from storage.
    //
    readNotebook(notebookId: INotebookStorageId): Promise<INotebookViewModel>;

    //
    // Makes the id for a new untititled notebook.
    //
    makeUntitledNotebookId(): INotebookStorageId;

    //
    // Shows a dialog to allow the user to choose a notebook to open.
    //
    showNotebookOpenDialog(directoryPath?: string): Promise<INotebookStorageId | undefined>;

    //
    // Shows a dialog to allow the user to save their notebook to a new location.
    //
    showNotebookSaveAsDialog(existingNotebookId: INotebookStorageId): Promise<INotebookStorageId | undefined>;

    //
    // Gets the list of example notebooks.
    //
    getExampleNotebooks(): Promise<IExampleNotebook[]>;
}