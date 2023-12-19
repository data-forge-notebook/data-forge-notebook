import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { BasicEventHandler, IEventSource, EventSource, ILogId, ILog } from "utils";
import { CellType, ISerializedCell1 } from "model";
import { ISerializedNotebook1 } from "model";
import { IIdGenerator, IIdGeneratorId } from "utils/src/lib/id-generator";
import { INotebookViewModel, notebookVersion } from "./notebook";
import * as path from "path";
import { IConfirmationDialog, IConfirmationDialogId } from "../services/confirmation-dialog";
import { INotification, INotificationId } from "../services/notification";
import { IEvaluatorClient, IEvaluatorId } from "../services/evaluator-client";
import { ICodeCellViewModel } from "./code-cell";
import { ICommander, ICommanderId } from "../services/commander";
import { IUndoRedo, IUndoRedoId } from "../services/undoredo";
import { IRecentFiles, IRecentFiles_ID } from "../services/recent-files";
import { IZoom, IZoomId } from "../services/zoom";
import { ICellViewModel } from "./cell";
import { CellErrorViewModel } from "./cell-error";
import { action, computed, makeObservable, observable } from "mobx";
import { deserializeCellOutput, deserializeNotebook } from "../serialization/json/deserialize";
import { INotebookStorageId, INotebookRepositoryId, INotebookRepository } from "../services/notebook-repository";

type OpenNotebookChangedEventHandler = (isReload: boolean) => Promise<void>;

//
// Registers the choice the makers to save, don't save or cancel when closing a notebook that is modified but not saved.
//
export enum SaveChoice {
    Save = "Save",
    DontSave = "Don't save",
    Cancel = "Cancel",
}

//
// View-mmodel for the app.
//
export interface INotebookEditorViewModel  {

    //
    // The currently open notebook.
    //
    readonly notebook: INotebookViewModel | undefined;

    //
    // When greater than 0 the app is busy wth a global task.
    //
    readonly numBlockingTasks: number;

    // 
    // Set to true when the app is evaluating a notebook.
    //
    readonly evaluating: boolean;

    // 
    // Set to true when the app is installing a notebook.
    //
    readonly installing: boolean;

    //
    // Set to true when the hotkeys overlay is open.
    //
    readonly showHotkeysOverlay: boolean;

    //
    // Set to true to show the command palette.
    //
    readonly showCommandPalette: boolean;

    //
    // Set to true to show the recent file picker.
    //
    readonly showRecentFilePicker: boolean;

    //
    // Set to true to show the example browser.
    //
    readonly showExampleBrowser: boolean;

    //
    // Cell currently in the clipboard to be pasted.
    //
    readonly cellClipboard: ISerializedCell1 | undefined;
    
    //
    // Mounts the UI.
    //
    mount(): void;

    // 
    // Unmounts the UI.
    //
    unmount(): void;

    //
    // Returns true when the app has a blocking task in progress.
    //
    get isBlocked(): boolean;

    //
    // Start a global task.
    //
    startBlockingTask(): void;

    //
    // End a global task.
    //
    endBlockingTask(): void;

    //
    // Sets a new notebook and rebind/raise appropriate events.
    //
    setNotebook(notebook: INotebookViewModel, isReload: boolean): Promise<void>;

    //
    // Prompt the user as to whether they should save their notebook.
    //
    promptSave(title: string): Promise<boolean>;

    //
    // Create a new notebook.
    // Returns null if we couldn't create a new notebook.
    //
    newNotebook(): Promise<INotebookViewModel | undefined>;

    //
    // Open a notebook from a user-selected file.
    //
    openNotebook(directoryPath?: string): Promise<INotebookViewModel | undefined>;

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
    saveNotebookAs(): Promise<void>;

    //
    // Reloads the current notebook.
    //
    reloadNotebook(): Promise<void>;

    //
    // Evaluates the current notebook.
    //
    evaluateNotebook(): Promise<void>;
    
    //
    // Evaluate up to the particular cell.
    //
    evaluateToCell(cell?: ICellViewModel): Promise<void>;

    //
    // Evaluate the single cell.
    //
    evaluateSingleCell(cell: ICellViewModel): Promise<void>;

    //
    // Notify that the editor is ready for use.
    //
    notifyEditorReady(): Promise<void>;

    //
    // Event raised when the notebook editor is ready for use.
    //
    onEditorReady: IEventSource<BasicEventHandler>;

    //
    // Event raised when the open notebook is about to change.
    //
    onOpenNotebookWillChange: IEventSource<BasicEventHandler>;
    
    //
    // Event raised when the open notebook have changed.
    //
    onOpenNotebookChanged: IEventSource<OpenNotebookChangedEventHandler>;

    //
    // Event raised when the set notebook has been rendered.
    //
    onNotebookRendered: IEventSource<BasicEventHandler>;

    //
    // Toggle the hotkeys overlay.
    //
    toggleHotkeysOverlay(): void;

    //
    // Opens or closes the command palette.
    //
    toggleCommandPalette(): Promise<void>;

    //
    // Opens or closes the recent file picker.
    //
    toggleRecentFilePicker(): Promise<void>;

    //
    // Opens or closes the example notebook browser.
    //
    toggleExamplesBrowser(): Promise<void>;

    //
    // Sets the cell currently in the clipboard to be pasted.
    //
    setCellClipboard(cellClipboard: ISerializedCell1 | undefined): void;
}

@InjectableClass()
export class NotebookEditorViewModel implements INotebookEditorViewModel {

    @InjectProperty(IIdGeneratorId)
    idGenerator!: IIdGenerator;

    @InjectProperty(ILogId)
    log!: ILog;

    @InjectProperty(INotificationId)
    notification!: INotification;

    @InjectProperty(INotebookRepositoryId)
    notebookRepository!: INotebookRepository;

    @InjectProperty(IConfirmationDialogId)
    confirmationDialog!: IConfirmationDialog;

    @InjectProperty(IEvaluatorId)
    evaluator!: IEvaluatorClient;

    @InjectProperty(ICommanderId)
    commander!: ICommander;

    @InjectProperty(IUndoRedoId)
    undoRedo!: IUndoRedo;

    @InjectProperty(IRecentFiles_ID)
    recentFiles!: IRecentFiles;

    @InjectProperty(IZoomId)
    zoom!: IZoom;

    //
    // The currently open notebook.
    //
    notebook: INotebookViewModel | undefined = undefined;

    //
    // When greater than 0 the app is busy wth a global task.
    //
    numBlockingTasks: number = 0;

    // 
    // Set to true when the app is evaluating a notebook.
    //
    evaluating: boolean = false;

    // 
    // Set to true when the app is installing a notebook.
    //
    installing: boolean = false;

    //
    // Set to true when the hotkeys overlay is open.
    //
    showHotkeysOverlay: boolean = false;

    //
    // Set to true to show the command palette.
    //
    showCommandPalette: boolean = false;

    //
    // Set to true to show the recent file picker.
    //
    showRecentFilePicker: boolean = false;

    //
    // Set to true to show the example browser.
    //
    showExampleBrowser: boolean = false;

    //
    // Cell currently in the clipboard to be pasted.
    //
    cellClipboard: ISerializedCell1 | undefined = undefined;

    constructor(notebook?: INotebookViewModel) { 
        if (notebook) {
            this.notebook = notebook;
        }

        makeObservable(this, {
            notebook: observable,
            numBlockingTasks: observable,
            evaluating: observable,
            installing: observable,
            showHotkeysOverlay: observable,
            showCommandPalette: observable,
            showRecentFilePicker: observable,
            showExampleBrowser: observable,
            isBlocked: computed,
            startBlockingTask: action,
            endBlockingTask: action,
            setNotebook: action,
            newNotebook: action,
            openNotebook: action,
            openSpecificNotebook: action,
            internalOpenNotebook: action,
            saveNotebook: action,
            saveNotebookAs: action,
            reloadNotebook: action,
            evaluateNotebook: action,
            evaluateToCell: action,
            evaluateSingleCell: action,
            onEvaluatorEvent: action,
            onInstallationStarted: action,
            onInstallationFinished: action,
            onEvaluationStarted: action,
            onEvaluationFinished: action,
            toggleHotkeysOverlay: action,
            toggleCommandPalette: action,
            toggleRecentFilePicker: action,
            toggleExamplesBrowser: action,
        });
    }

    //
    // Mounts the UI.
    //
    mount(): void {
        this.evaluator.onEvaluationEvent.attach(this.onEvaluatorEvent);

        //
        // Allows commands to be run against this notebook editor.
        //
        this.commander.setNotebookEditor(this);

        if (this.notebook) {
            this.undoRedo.clearStack(this.notebook!);
        }

        this.zoom.init();
    }

    // 
    // Unmounts the UI.
    //
    unmount(): void {
        this.evaluator.onEvaluationEvent.detach(this.onEvaluatorEvent);

        this.zoom.deinit();
    }

    //
    // Returns true when the app has a global task in progress.
    //
    get isBlocked(): boolean {
        return this.numBlockingTasks > 0;
    }

    //
    // Start a global task.
    //
    startBlockingTask(): void {
        const isFirstTask = this.numBlockingTasks <= 0;
        ++this.numBlockingTasks;
    }

    //
    // End a global task.
    //
    endBlockingTask(): void {
        --this.numBlockingTasks;
    }
    
    //
    // Sets a new notebook and rebind/raise appropriate events.
    //
    async setNotebook(notebook: INotebookViewModel, isReload: boolean): Promise<void> {

        await this.onOpenNotebookWillChange.raise();

        if (this.notebook) {
            //
            // Stop evaluation of whatever  notebook is being unloaded.
            //
            this.evaluator.stopEvaluation(this.notebook.instanceId);
        }
        
        this.notebook = notebook;

        this.onInstallationStarted();

        this.evaluator.installNotebook(notebook.instanceId, notebook.serializeForEval(), notebook.storageId.getContainingPath());

        await this.notifyOpenNotebookChanged(isReload);

        await this.onNotebookRendered.raise();
    }

    //
    // Prompt the user as to whether they should save their notebook.
    //
    async promptSave(title: string): Promise<boolean> {
        if (!this.notebook) {
            return true; // Notebook notebook loaded yet, allow operation to procede.
        }

        if (!this.notebook.isModified) {
            return true; // Notebook not modified, allow operation to proceee.
        }

        const choice = await this.confirmationDialog.show({
            title: title,
            options: [SaveChoice.Save, SaveChoice.DontSave, SaveChoice.Cancel],
            msg: 
                "Do you want to save changes that you made to " + this.notebook.storageId.displayName() +
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
    newNotebookTemplate(): ISerializedNotebook1 {
        const template: ISerializedNotebook1 = {
            "version": notebookVersion,
            "cells": [
                {
                    "cellType": CellType.Code,
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
    async newNotebook(): Promise<INotebookViewModel | undefined> { 

        if (this.isBlocked) {
            this.notification.warn("Already working!");
            return undefined;
        }

        this.log.info(`Creating new notebook for language.`);

        if (await this.promptSave("New notebook")) {
			this.startBlockingTask();
        	
            try {
                const newNotebookId = this.notebookRepository.makeUntitledNotebookId();
                const notebookTemplate = this.newNotebookTemplate();
                const notebook = deserializeNotebook(newNotebookId, true, false, notebookTemplate);
                await this.setNotebook(notebook, false);
                notebook.select(notebook.cells[0]); // Auto select the first cell.
                return this.notebook!;
            }
            finally {
                this.endBlockingTask();
            }
        }
        else {
            return undefined;
        }
    }

    //
    // Open a notebook from a user-selected file.
    //
    async openNotebook(directoryPath?: string): Promise<INotebookViewModel | undefined> {
        if (this.isBlocked) {
            this.notification.warn("Already working!");
            return undefined;
        }

        if (!await this.promptSave("Open notebook")) {
            // User has an unsaved notebook that they want to save.
            return undefined;
        }

        const notebookId = await this.notebookRepository.showNotebookOpenDialog(directoryPath);
        if (!notebookId) {
            return undefined;
        }

        return await this.internalOpenNotebook(notebookId, false);
    }

    //
    // Open a notebook from a specific location.
    //
    async openSpecificNotebook(notebookId: INotebookStorageId): Promise<INotebookViewModel | undefined> {

        if (this.isBlocked) {
            this.notification.warn("Already working!");
            return undefined;
        }

        if (!await this.promptSave("Open notebook")) {
            // User has an unsaved notebook that they want to save.
            return undefined;
        }

        const notebook = await this.internalOpenNotebook(notebookId, false);
        return notebook;
    }

    //
    // Open a notebook from a specific file.
    //
    async internalOpenNotebook(notebookId: INotebookStorageId, isReload: boolean): Promise<INotebookViewModel | undefined> {

		this.startBlockingTask();

		this.log.info("Opening notebook: " + notebookId.displayName());

        try {
			const notebook = await this.notebookRepository.readNotebook(notebookId);
			await this.setNotebook(notebook, isReload);
            const filePath = notebookId.toString();
            if (filePath) {
                this.recentFiles.addRecentFile(filePath);
            }

			this.log.info("Opened notebook: " + notebookId.displayName());

            return this.notebook!;
        }
        catch (err) {
            this.log.error("Error opening notebook: " + notebookId.displayName());
            this.log.error(err & err.stack || err);
            const msg = "Failed to open notebook: " + path.basename(notebookId.displayName())
                + "\r\nError: " + (err && (err.message || err.stack || err.toString()) || "unknown");
            this.notification.error(msg);
            return undefined;
        }
        finally {
            this.endBlockingTask();
        }
    }

    //
    // Save the currently open notebook to it's previous file name.
    //
    async saveNotebook(): Promise<void> {
        if (this.isBlocked) {
            this.notification.warn("Already working!");
            return;
        }

        if (!this.notebook) {
            this.notification.warn("No notebook open!");
            return;
        }

        if (this.notebook.unsaved || this.notebook.readOnly) {
            await this.saveNotebookAs();
        }
        else {
            await this.notebook.save();
        }
    }

    //
    // Save the notebook as a new file.
    //
    async saveNotebookAs(): Promise<void> {
        if (this.isBlocked) {
            this.notification.warn("Already working!");
            return;
        }

        if (!this.notebook) {
            this.notification.warn("No notebook open!");
            return;
        }

        const newStorageId = await this.notebookRepository.showNotebookSaveAsDialog(this.notebook.storageId)
        if (!newStorageId) {
            // User cancelled.
            return;
        }

        await this.onOpenNotebookWillChange.raise();

        await this.notebook.saveAs(newStorageId);
        this.recentFiles.addRecentFile(newStorageId.toString()!);

        await this.notifyOpenNotebookChanged(false);
    }

    //
    // Reloads the current notebook.
    //
    async reloadNotebook(): Promise<void> {
        if (this.isBlocked) {
            this.notification.warn("Already working!");
            return;
        }

        if (!this.notebook) {
            this.notification.warn("No notebook open!");
            return;
        }

        if (!await this.promptSave("Reload notebook")) {
            // User has an unsaved notebook that they want to save.
            return;
        }

        await this.internalOpenNotebook(this.notebook.storageId, true);
    }

    //
    // Checks if the current notebook can be evaluated.
    //
    async checkCanEvaluateNotebook(): Promise<boolean> {
        if (this.isBlocked) {
            this.notification.warn("Already working!");
            return false;
        }

        if (!this.notebook) {
            this.notification.warn("You must create or open a notebook before evaluating it.");
            return false;
        }

        if (this.notebook.readOnly) {
            this.notification.error("The file for this notebook is readonly, please save it to a different location and copy any data files that it uses. Then you can run it.");
            return false;
        }

        return true;
    }

    //
    // Evaluates the current notebook.
    //
    async evaluateNotebook(): Promise<void> {

        if (!await this.checkCanEvaluateNotebook()) {
            return;
        }

        if (!this.notebook) {
            this.notification.warn("No notebook open!");
            return;
        }

        if (this.evaluating) {
            //
            // Trying to start an evaluation while one is already in progress will stop it.
            //
            this.evaluator.stopEvaluation(this.notebook.instanceId);
            await this.onEvaluationFinished();
            return;
        }

        await this.notebook.flushChanges();

        this.evaluating = true;
        this.evaluator.evalNotebook(this.notebook.instanceId, this.notebook.serializeForEval(), this.notebook.storageId.getContainingPath());

        await this.onEvaluationStarted();
    }

    //
    // Evaluate up to the particular cell.
    //
    async evaluateToCell(cell: ICellViewModel): Promise<void> {
        
        if (!await this.checkCanEvaluateNotebook()) {
            return;
        }

        if (!this.notebook) {
            this.notification.warn("No notebook open!");
            return;
        }
        
        if (this.evaluating) {
            //
            // Trying to start an evaluation while one is already in progress will stop it.
            //
            this.evaluator.stopEvaluation(this.notebook.instanceId);
            await this.onEvaluationFinished();
            return;
        }

        await this.notebook.flushChanges();

        this.evaluating = true;
        this.evaluator.evalToCell(this.notebook.instanceId, this.notebook.serializeForEval(), cell.instanceId, this.notebook.storageId.getContainingPath());

        await this.onEvaluationStarted();
    }

    //
    // Evaluate the single cell.
    //
    async evaluateSingleCell(cell: ICellViewModel): Promise<void> {
        
        if (!await this.checkCanEvaluateNotebook()) {
            return;
        }

        if (!this.notebook) {
            this.notification.warn("No notebook open!");
            return;
        }

        if (this.evaluating) {
            //
            // Trying to start an evaluation while one is already in progress will stop it.
            //
            this.evaluator.stopEvaluation(this.notebook.instanceId);
            await this.onEvaluationFinished();
            return;
        }

        await this.notebook.flushChanges();

        if (cell.cellType !== CellType.Code) {
            this.notification.warn("Requested cell is not a code cell.");
            return;
        }

        this.evaluating = true;
        this.evaluator.evalSingleCell(this.notebook.instanceId, this.notebook.serializeForEval(), cell.instanceId, this.notebook.storageId.getContainingPath());

        await this.onEvaluationStarted();
    }

    //
    // Event handlers for the evaluation engine.
    //
    evaluatorEventHandlers: { [index: string]: (args: any) => Promise<void> } = {

        "notebook-install-started": async (args: any): Promise<void> => {
            // Nothing yet.
        },

        "notebook-install-completed": async (args: any): Promise<void> => {
            this.onInstallationFinished();
        },

        "notebook-eval-started": async (args: any): Promise<void> => {
            // Nothing yet.
        },

        "cell-eval-started": async (args: any): Promise<void> => {
            const cell = this.notebook!.findCell(args.cellId);
            if (cell) {
                await cell.notifyCodeEvalStarted();
            }
            else {
                this.log.error("cell-eval-started: Failed to find cell " + args.cellId);
            }
        },

        "cell-eval-completed": async (args: any): Promise<void> => {
            const cell = this.notebook!.findCell(args.cellId);
            if (cell) {
                await cell.notifyCodeEvalComplete();
            }
            else {
                this.log.error("cell-eval-completed: Failed to find cell " + args.cellId);
            }
        },

        "notebook-eval-completed": async (args: any): Promise<void> => {
            await this.onEvaluationFinished();
        },

        "output-capped": async () => {
            this.notification.warn("Output and errors from code have been capped to 1000 items, perhaps you have an infinite loop in your code?");
        },

        "receive-display": async (args: any): Promise<void> => {
            for (const cellOutput of args.outputs) {
                const cell = this.notebook!.findCell(cellOutput.cellId) as ICodeCellViewModel;
                if (cell) {
                    cell.addOutput(deserializeCellOutput({ value:  cellOutput.output }));
                }
                else {
                    this.log.error("receive-display: Failed to find cell " + cellOutput.cellId);
                }
            }
        },

        "receive-error": async (args: any): Promise<void> => {
            this.reportError(args.cellId, args.error);
        },
    };

    //
    // Report an error to a particular cell.
    //
    reportError(cellId: string | undefined, error: string) {
        const cell = cellId && this.notebook!.findCell(cellId) as ICodeCellViewModel;
        if (cell) {
            cell.addError(new CellErrorViewModel(error));
        }
        else {
            //
            // Just add the error to the first code cell.
            //
            for (const cell of this.notebook!.cells) {
                if (cell.cellType === CellType.Code) {
                    (cell as ICodeCellViewModel).addError(new CellErrorViewModel(error));
                    return;
                }
            }

            this.log.error("receive-error: Failed to find cell " + cellId + ", error = " + error);
        }
    }

    //
    // Event raised when an event is recieved from the evaluator.
    //
    onEvaluatorEvent = async (args: any): Promise<void> => {
        const event = args.event as string;
        const eventHandler = this.evaluatorEventHandlers[event];
        if (eventHandler) {
            await eventHandler(args);
        }
        else {
            this.log.error(`Not handling evaluation event ${event}.`);
        }
    }

    //
    // Notification that notebook installation has started.
    //
    onInstallationStarted(): void {
        this.installing = true;
    }

    //
    // Notification that notebook installation has completed.
    //
    onInstallationFinished(): void {
        this.installing = false;
    }

    //
    // Notification that evaluation has started.
    //
    async onEvaluationStarted(): Promise<void> {
        await this.notebook!.notifyCodeEvalStarted();
    }

    //
    // Notification that evaluation has completed.
    //
    async onEvaluationFinished(): Promise<void> {
        this.evaluating = false;
        await this.notebook!.notifyCodeEvalComplete();
    }

    //
    // Notify that the editor is ready for use.
    //
    async notifyEditorReady(): Promise<void> {
        await this.onEditorReady.raise();
    }

    //
    // Event raised when the notebook editor is ready for use.
    //
    onEditorReady: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Event raised when the open notebook is about to change.
    //
    onOpenNotebookWillChange: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Called when the currently open notebook has changed.
    //
    async notifyOpenNotebookChanged(isReload: boolean): Promise<void> {
        await this.onOpenNotebookChanged.raise(isReload);

        this.undoRedo.clearStack(this.notebook!);
    }
    
    //
    // Event raised when the open notebook have changed.
    //
    onOpenNotebookChanged: IEventSource<OpenNotebookChangedEventHandler> = new EventSource<OpenNotebookChangedEventHandler>();

    //
    // Event raised when the set notebook has been rendered.
    //
    onNotebookRendered: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Toggle the hotkeys overlay.
    //
    toggleHotkeysOverlay(): void {
        this.showHotkeysOverlay = !this.showHotkeysOverlay;
    }

    //
    // Opens or closes the command palette.
    //
    async toggleCommandPalette(): Promise<void> {
        this.showCommandPalette = !this.showCommandPalette;
    }

    //
    // Opens or closes the recent file picker.
    //
    async toggleRecentFilePicker(): Promise<void> {
        this.showRecentFilePicker = !this.showRecentFilePicker;
    }

    //
    // Opens or closes the example notebook browser.
    //
    async toggleExamplesBrowser(): Promise<void> {
        this.showExampleBrowser = !this.showExampleBrowser;
    }

    //
    // Sets the cell currently in the clipboard to be pasted.
    //
    setCellClipboard(cellClipboard: ISerializedCell1 | undefined): void {
        this.cellClipboard = cellClipboard;
    }
}
