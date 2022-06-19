import { ISerializedNotebook1 } from "../model/serialization/serialized1";

//
// ID for the notebook repository service.
//
export const INotebookRepositoryId = "INotebookRepository";

//
// Identifies a notebook in storage.
//
export interface INotebookStorageId {

    //
    // Get the id as a path.
    //
    asPath(): string;
}

//
// Interface to a repository of notebooks. Used to load and save notebooks.
//
export interface INotebookRepository {

    //
    // Check if the requested notebook is already in storage.
    //
    exists(notebookId: INotebookStorageId): Promise<boolean>;

    //
    // Writes a notebook to storage.
    //
    writeNotebook(notebook: ISerializedNotebook1, notebookId: INotebookStorageId): Promise<void>;

    //
    // Reads a notebook from storage.
    //
    readNotebook(notebookId: INotebookStorageId): Promise<{ data: ISerializedNotebook1, readOnly: boolean }>;

    //
    // Shows a dialog to allow the user to choose a notebook to open.
    //
    showNotebookOpenDialog(openFilePath?: string, settingsKey?: string, directoryPath?: string): Promise<INotebookStorageId | undefined>;

    //
    // Shows a dialog to allow the user to save their notebook to a new location.
    //
    showNotebookSaveAsDialog(existingNotebookId: INotebookStorageId | undefined, specifiedLocation?: string): Promise<INotebookStorageId | undefined>;
}