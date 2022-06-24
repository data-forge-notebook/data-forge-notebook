import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { BasicEventHandler, IEventSource, EventSource } from "../lib/event-source";
import { CellScope, CellType } from "../model/cell";
import { notebookVersion } from "../model/notebook";
import { ISerializedNotebook1 } from "../model/serialization/serialized1";
import { IIdGenerator, IIdGeneratorId } from "../services/id-generator";
import { INotebookRepository, INotebookRepositoryId, INotebookStorageId } from "../services/notebook-repository";
import { INotebookViewModel, NotebookViewModel } from "./notebook";
import * as path from "path";
import { IConfirmationDialog, IConfirmationDialogId } from "../services/confirmation-dialog";

const defaultNodejsVersion = "v16.14.0"; //TODO: eventually this needs to be determined by the installer.

type OpenNotebookChangedEventHandler = (isReload: boolean) => Promise<void>;

//
// Registers the choice the makers to save, don't save or cancel when closing a notebook that is modified but not saved.
//
enum SaveChoice {
    Save = "Save",
    DontSave = "Don't save",
    Cancel = "Cancel",
}

//
// View-mmodel for the app.
//
export interface INotebookEditorViewModel {
    
    //
    // Returns true after a notebook has been opened.
    //
    isNotebookOpen(): boolean; 

    //
    // Get the currently open notebook.
    //
    getOpenNotebook(): INotebookViewModel;

    //
    // Prompt the user as to whether they should save their notebook.
    //
    promptSave(title: string): Promise<boolean>;

    //
    // Create a new notebook.
    // Returns null if we couldn't create a new notebook.
    //
    newNotebook(language: string): Promise<INotebookViewModel | undefined>;

    //
    // Open a notebook from a user-selected file.
    //
    openNotebook(openFilePath?: string, directoryPath?: string): Promise<INotebookViewModel | undefined>;

    //
    // Open a notebook from a specific location.
    //
    openSpecificNotebook(storageId: INotebookStorageId): Promise<INotebookViewModel | undefined>;

    //
    // Save the currently open notebook to it's previous file name.
    //
    saveNotebook(): Promise<void>;

    //
    // Save the notebook as a new file.
    //
    saveNotebookAs(filePath?: string): Promise<void>;

    //
    // Reloads the current notebook.
    //
    reloadNotebook(): Promise<void>;
    
    //
    // Notify the app that a notebook was modified.
    //
    notifyModified(): Promise<void>;

    //
    // Event raised when the content of the notebook has been modified.
    //
    onModified: IEventSource<BasicEventHandler>;

    //
    // Event raised when the open notebook is about to change.
    //
    onOpenNotebookWillChange: IEventSource<BasicEventHandler>;
    
    //
    // Event raised when the open notebook have changed.
    //
    onOpenNotebookChanged: IEventSource<OpenNotebookChangedEventHandler>;

}

@InjectableClass()
export class NotebookEditorViewModel implements INotebookEditorViewModel {

    @InjectProperty(IIdGeneratorId)
    idGenerator!: IIdGenerator;

    @InjectProperty(INotebookRepositoryId)
    notebookRepository!: INotebookRepository;

    @InjectProperty(IConfirmationDialogId)
    confirmationDialog!: IConfirmationDialog;

    //
    // The currently open notebook.
    //
    private notebook: INotebookViewModel | undefined = undefined;

    constructor(notebook?: INotebookViewModel) {
        this.notifyModified = this.notifyModified.bind(this);
        
        if (notebook) {
            this.notebook = notebook;
            this.notebook.onModified.attach(this.notifyModified);
        }
    }

    //
    // Returns true after a notebook has been opened.
    //
    isNotebookOpen(): boolean {
        return !!this.notebook;
    }
    
    //
    // Get the currently open notebook.
    //
    getOpenNotebook(): INotebookViewModel {
        if (this.notebook) {
            return this.notebook;
        }
        else {
            throw new Error("No notebook is currently open.");
        }
    }

    //
    // Internal function to set a new notebook and rebind/raise appropriate events.
    //
    async setNotebook(createNotebook: () => Promise<INotebookViewModel>, isReload: boolean): Promise<void> {

        if (this.notebook) {
            await this.onOpenNotebookWillChange.raise();
            this.notebook.onModified.detach(this.notifyModified);
        }
        
        this.notebook = await createNotebook();

        this.notebook.onModified.attach(this.notifyModified);

        await this.notifyOpenNotebookChanged(isReload);
    }

    //
    // Prompt the user as to whether they should save their notebook.
    //
    async promptSave(title: string): Promise<boolean> {
        if (!this.notebook) {
            return true; // Notebook notebook loaded yet, allow operation to procede.
        }

        if (!this.notebook.isModified()) {
            return true; // Notebook not modified, allow operation to procede.
        }

        const choice = await this.confirmationDialog.show({
            title: title,
            options: ["Save", "Don't save", "Cancel"],
            msg: 
                "Do you want to save changes that you made to " + this.notebook.getStorageId().toString() +
                "\r\nIf you don't save your changes will be lost.",
        }) as SaveChoice;

        if (choice === SaveChoice.Save) {
            // Save current notebook.
            await this.saveNotebook();
        }
        else if (choice == SaveChoice.Cancel) {
            return false; // Abort.
        }

        return true; // Allow operation to procede.        
    }
    
    //
    // Create a template for a new notebok.
    //
    private newNotebookTemplate(language: string): ISerializedNotebook1 {
        const template: ISerializedNotebook1 = {
            "version": notebookVersion,
            "language": language,
            "cells": [
                {
                    "id": this.idGenerator.genId(),
                    "cellType": CellType.Code,
                    "cellScope": CellScope.Global,
                    "code": "",
                    "output": [],
                    "errors": []
                }
            ]
        };
        return template;
    }

    //
    // Create a new notebook.
    //
    async newNotebook(language: string): Promise<INotebookViewModel | undefined> { 

        if (await this.promptSave("New notebook")) {
            await this.setNotebook(
                async () => {
                    const newNotebookId = await this.notebookRepository.makeUntitledNotebookId();
                    const notebookTemplate = this.newNotebookTemplate(language);
                    return NotebookViewModel.deserialize(newNotebookId, true, false, defaultNodejsVersion, notebookTemplate);
                },
                false
            );
            this.notebook!.getCells()[0].select();
            return this.notebook!;
        }
        else {
            return undefined;
        }
    }

    //
    // Open a notebook from a user-selected file.
    //
    async openNotebook(openFilePath?: string, directoryPath?: string): Promise<INotebookViewModel | undefined> {

        if (!await this.promptSave("Open notebook")) {
            // User has an unsaved notebook that they want to save.
            return undefined;
        }

        const notebookId = await this.notebookRepository.showNotebookOpenDialog(openFilePath, directoryPath);
        if (!notebookId) {
            return undefined;
        }

        return await this.internalOpenNotebook(notebookId, false);
    }

    //
    // Open a notebook from a specific location.
    //
    async openSpecificNotebook(notebookId: INotebookStorageId): Promise<INotebookViewModel | undefined> {

        if (this.notebook && !await this.promptSave("Open notebook")) {
            // User has an unsaved notebook that they want to save.
            return undefined;
        }

        const notebook = await this.internalOpenNotebook(notebookId, false);
        return notebook;
    }

    //
    // Open a notebook from a specific file.
    //
    private async internalOpenNotebook(notebookId: INotebookStorageId, isReload: boolean): Promise<INotebookViewModel | undefined> {

        try {
            await this.setNotebook(
                async () => {
                    return await this.loadNotebookFile(notebookId, defaultNodejsVersion);
                },
                isReload
            );

            return this.notebook!;
        }
        catch (err) {
            console.error("Error opening notebook: " + notebookId.toString());
            console.error(err & err.stack || err);
            
            const msg = "Failed to open notebook: " + path.basename(notebookId.toString())
                + "\r\nFrom directory: " + path.dirname(notebookId.toString())
                + "\r\nError: " + (err && (err.message || err.stack || err.toString()) || "unknown");
            alert(msg); //TODO: Need a proper notification for this.

            return undefined;
        }
    }

    //
    // Save the currently open notebook to it's previous file name.
    //
    async saveNotebook(): Promise<void> {
        const notebook = this.getOpenNotebook();
        if (notebook.isUnsaved() || notebook.isReadOnly()) {
            await this.saveNotebookAs();
        }
        else {
            await notebook.save();
        }
    }

    //
    // Save the notebook as a new file.
    //
    async saveNotebookAs(defaultLocation?: string): Promise<void> {

        const notebook = this.getOpenNotebook();
        const newStorageId = await this.notebookRepository.showNotebookSaveAsDialog(notebook.getStorageId(), defaultLocation)
        if (!newStorageId) {
            // User cancelled.
            return;
        }

        await this.onOpenNotebookWillChange.raise();

        await notebook.saveAs(newStorageId);

        await this.notifyOpenNotebookChanged(false);
    }

    //
    // Reloads the current notebook.
    //
    async reloadNotebook(): Promise<void> {

        if (!await this.promptSave("Reload notebook")) {
            // User has an unsaved notebook that they want to save.
            return;
        }

        await this.internalOpenNotebook(this.getOpenNotebook().getStorageId(), true);
    }

    
    //
    // Notify the app that a notebook was modified.
    //
    async notifyModified(): Promise<void> {
        await this.onModified.raise();
    }

    //
    // Event raised when the content of the notebook has been modified.
    //
    onModified: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Event raised when the open notebook is about to change.
    //
    onOpenNotebookWillChange: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Called when the currently open notebook has changed.
    //
    private async notifyOpenNotebookChanged(isReload: boolean): Promise<void> {
        await this.onOpenNotebookChanged.raise(isReload);
    }
    
    //
    // Event raised when the open notebook have changed.
    //
    onOpenNotebookChanged: IEventSource<OpenNotebookChangedEventHandler> = new EventSource<OpenNotebookChangedEventHandler>();

    //
    // Event raised when code evaluation has completed.
    //
    onEvaluationCompleted: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Load the notebook from a file.
    //
    private async loadNotebookFile(storageId: INotebookStorageId, defaultNodejsVersion: string): Promise<INotebookViewModel> {
        const { data, readOnly } = await this.notebookRepository.readNotebook(storageId);
        return NotebookViewModel.deserialize(storageId, false, readOnly, defaultNodejsVersion, data);
    }

}
