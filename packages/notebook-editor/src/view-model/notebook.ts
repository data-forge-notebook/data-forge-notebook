import { ICellViewModel } from "./cell";
import { INotebookCaretPosition } from "./notebook-caret-position";
import { CodeCellViewModel } from "./code-cell";
import { IEventSource, BasicEventHandler, EventSource, ILog, ILogId } from "utils";
import { CellType, ISerializedCell1, ISerializedNotebook1 } from "model";
import { MarkdownCellViewModel } from "./markdown-cell";
import { INotebookRepository, INotebookRepositoryId, INotebookStorageId } from "storage";
import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { v4 as uuid } from "uuid";
import { action, computed, makeObservable, observable } from "mobx";

export const notebookVersion = 3;

//
// Creates a cell view-model based on cell type.
//

export function cellViewModelFactory(cell: ISerializedCell1): ICellViewModel {

    if (!cell) {
        throw new Error("Cell model not specified.");
    }

    if (cell.cellType === CellType.Code) {
        return CodeCellViewModel.deserialize(cell);
    }
    else if (cell.cellType === CellType.Markdown) {
        return MarkdownCellViewModel.deserialize(cell);
    }
    else {
        throw new Error("Unexpected cell type: " + cell.cellType);
    }
}

//
// The view-model for the entire notebook.
//
export interface INotebookViewModel {

    //
    // Identifies the notebook in storage.
    //
    readonly storageId: INotebookStorageId;

    //
    // The ID for this notebook instance.
    // This is not serialized and not persistant.
    //
    readonly instanceId: string;

    //
    // Description of the notebook, if any.
    //
    readonly description?: string;

    //
    // List of cells in the notebook.
    //
    readonly cells: ICellViewModel[];

    //
    // Set to true when the notebook is executing.
    //
    readonly executing: boolean;
    
    //
    // The currently selected cell.
    //
    readonly selectedCell: ICellViewModel | undefined;

    //
    // Set to true when the notebook is modified but not saved.
    //
    readonly modified: boolean;
    
    //
    // Set to true when the notebook is unsaved in memory.
    //
    readonly unsaved: boolean;

    //
    // Set to true if the notebook was loaded from a read only file.
    //
    readonly readOnly: boolean;

    //
    // Returns true when the cell or children have been modified.
    //
    get isModified(): boolean;    

    //
    // Mark the notebook as modified or unmodified.
    //
    setModified(modified: boolean): void;

    //
    // Mark the entire model as umnodified.
    //
    makeUnmodified(): void;

    //
    // Selects a cell in the notebook.
    //
    select(cell: ICellViewModel): Promise<void>;    

    //
    // Deselect the currently selected cell, if any.
    //
    deselect(): Promise<void>;

    //
    // Get the position of a cell.
    //
    getCellIndex(cellViewModel: ICellViewModel): number;

    //
    // Get a cell by index.
    //
    getCellByIndex(cellIndex: number): ICellViewModel | undefined;

    //
    // Add an existing cell view model to the collection of cells.
    //
    addCell(cell: ICellViewModel, position: number): Promise<void>;

    //
    // Delete the cell from the notebook.
    //
    deleteCell(cell: ICellViewModel, selectNextCell: boolean): Promise<void>;

    //
    // Reorder cells.
    //
    moveCell(startIndex: number, endIndex: number): Promise<void>;

    //
    // Find a cell by id.
    //
    findCell(cellId: string): ICellViewModel | undefined;

    //
    // Find the next cell after the requested cell, or undefined if no more cells.
    //
    findNextCell(cellId: string): ICellViewModel | undefined;

    //
    // Find the prev cell before the requested cell, or undefined if no more cells.
    //
    findPrevCell(cellId: string): ICellViewModel | undefined;

    //
    // Get the first cell, or undefined if there are no cells.
    //
    getFirstCell(): ICellViewModel | undefined;

    //
    // Get the last cell, or undefined if there are no cells.
    //
    getLastCell(): ICellViewModel | undefined;

   
    //
    // Event raised when the selected cell has changed.
    //
    onSelectedCellChanged: IEventSource<BasicEventHandler>;

    //  
    // Get the position of the caret in the notebook.
    //
    getCaretPosition(): INotebookCaretPosition | undefined;

    //
    // Get the index of the currently selected cell in the notebook.
    //
    getSelectedCellIndex(): number | undefined;

    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedNotebook1;

    //
    // Serialize the notebook for evaluation. This excludes elements of the data that aren't needed for evaluation.
    //
    serializeForEval(): ISerializedNotebook1;

    //
    // Save the notebook to the current filename.
    //
    save(): Promise<void>;

    //
    // Save the notebook to a particular file.
    //
    saveAs(newStorageId: INotebookStorageId): Promise<void>;

    //
    // Clear all the outputs from the notebook.
    //
    clearOutputs(): Promise<void>;

    //
    // Clear all errors from the notebook.
    //
    clearErrors(): Promise<void>;

    //
    // Notify the model it is about to be saved.
    //
    flushChanges(): Promise<void>;

    //
    // Event raised before the model is saved.
    //
    onFlushChanges: IEventSource<BasicEventHandler>;

    //
    // Start asynchronous evaluation of the notebook.
    //
    notifyCodeEvalStarted(): Promise<void>;

    //
    // Stop asynchronous evaluation of the notebook.
    //
    notifyCodeEvalComplete(): Promise<void>;
}

@InjectableClass()
export class NotebookViewModel implements INotebookViewModel {

    @InjectProperty(ILogId)
    log!: ILog;
    
    @InjectProperty(INotebookRepositoryId)
    notebookRepository!: INotebookRepository;

    //
    // Identifies the notebook in storage.
    //
    storageId: INotebookStorageId;

    //
    // The ID for this notebook instance.
    // This is not serialized and not persistant.
    //
    readonly instanceId: string = uuid();
    
    //
    // Description of the notebook, if any.
    //
    description?: string;

    //
    // List of cells in the notebook.
    //
    cells: ICellViewModel[];

    //
    // Set to true when the notebook is executing.
    //
    executing: boolean = false;
    
    //
    // The currently selected cell.
    //
    selectedCell: ICellViewModel | undefined = undefined;

    //
    // Set to true when the notebook is modified but not saved.
    //
    modified: boolean;

    //
    // Set to true when the notebook is unsaved in memory.
    //
    unsaved: boolean;

    //
    // Set to true if the notebook was loaded from a read only file.
    //
    readOnly: boolean;

    constructor(notebookStorageId: INotebookStorageId, cells: ICellViewModel[], description: string | undefined, unsaved: boolean, readOnly: boolean) {
        this.storageId = notebookStorageId;
        this.cells = cells;
        this.description = description;
        this.modified = false;
        this.unsaved = unsaved;
        this.readOnly = readOnly;

        makeObservable(this, {
            description: observable,
            cells: observable,
            executing: observable,
            selectedCell: observable,
            modified: observable,
            unsaved: observable,
            readOnly: observable,
            isModified: computed,
            setModified: action,
            makeUnmodified: action,
            select: action,
            deselect: action,
            addCell: action,
            deleteCell: action,
            moveCell: action,
            _save: action,
            save: action,
            saveAs: action,
            clearOutputs: action,
            clearErrors: action,
            notifyCodeEvalStarted: action,
            notifyCodeEvalComplete: action,
        });
    }

    //
    // Returns true when the cell or children have been modified.
    //
    get isModified(): boolean {
        if (this.modified) {
            return true;
        }

        for (const cell of this.cells) {
            if (cell.isModified) {
                return true;
            }
        }

        return false;
    }

    //
    // Mark the notebook as modified or unmodified.
    //
    setModified(modified: boolean): void {
        this.modified = modified;
    }

    //
    // Mark the entire model as unodified.
    //
    makeUnmodified(): void {
        this.modified = false;

        for (const cell of this.cells) {
            cell.makeUnmodified();
        }
    }

    //
    // Selects a cell in the notebook.
    //
    async select(cell: ICellViewModel): Promise<void> {
        if (this.selectedCell === cell) {
            // Already selected.
            return;
        }

        // 
        // Make sure everything else is selected before applying the new selection.
        //
        await this.deselect();

        //
        // Select the new cell.
        //
        await cell.select();

        this.selectedCell = cell;
        await this.onSelectedCellChanged.raise();
    }

    //
    // Deselects the selected cell in the notebook.
    //
    async deselect(): Promise<void> {
        if (this.selectedCell === undefined) {
            // No change.
            return;
        }

        await this.selectedCell.deselect();
        this.selectedCell = undefined;

        await this.onSelectedCellChanged.raise();
    }

    //
    // Get the position of a cell.
    // Returns -1 if the cell wasn't found.
    //
    getCellIndex(cellViewModel: ICellViewModel): number {
        return this.cells.indexOf(cellViewModel);
    }    

    //
    // Get a cell by index.
    //
    getCellByIndex(cellIndex: number): ICellViewModel | undefined {
        if (cellIndex >= 0 && cellIndex < this.cells.length) {
            return this.cells[cellIndex];
        }
        
        return undefined;
    }

    //
    // Add an existing cell view model to the collection of cells.
    //
    async addCell(cellViewModel: ICellViewModel, cellIndex: number): Promise<void> {
        await this.flushChanges();

        if (cellIndex > this.cells.length) {
            throw new Error(`Bad index ${cellIndex} for new cell in notebook with ${this.cells.length} existing cells!`);
        }
       
        this.cells.splice(cellIndex, 0, cellViewModel)

        this.modified = true;
    }

    //
    // Delete the cell from the notebook.
    //
    async deleteCell(cell: ICellViewModel, selectNextCell: boolean): Promise<void> {
        
        let nextSelectedCell = -1; // -1 Indicates no cell is selected next.
        const cells = this.cells;
        const cellIndex = cells.indexOf(cell);
        if (selectNextCell && cellIndex >= cells.length-1) {
            // Last cell is being deleted.
            if (cellIndex > 0) {
                nextSelectedCell = cellIndex-1; // Previous cell will be selected next.
            }
            else {
                // Only cell is being deleted.
            }
        }
        else {
            nextSelectedCell = cellIndex; // The cell after the deleted one will be selected next.
        }

        const cellId = cell.instanceId;

        const cellsRemoved = this.cells.filter(cell => cell.instanceId === cellId);

        this.cells = this.cells.filter(cell => cell.instanceId !== cellId);        

        if (selectNextCell && nextSelectedCell >= 0) {
            const nextFocusedCell = this.getCellByIndex(nextSelectedCell);
            if (nextFocusedCell) {
                await this.select(nextFocusedCell); // Automatically select the following cell.
            }
        }

        this.modified = true;
    }

    //
    // Move a cell from one index to another.
    //
    async moveCell(sourceIndex: number, destIndex: number): Promise<void> {

        const reorderedCells = Array.from(this.cells);
        const [ movedCell ] = reorderedCells.splice(sourceIndex, 1);
        reorderedCells.splice(destIndex, 0, movedCell);
        this.cells = reorderedCells;
        this.modified = true;
    }

    //
    // Find the index of a cell given it's id.
    //
    findCellIndex(cellId: string): number | undefined {
        let cellIndex = 0;
        while (cellIndex < this.cells.length) {
            if (this.cells[cellIndex].instanceId === cellId) {
                return cellIndex;
            }
            cellIndex += 1;
        }

        return undefined;
    }

    //
    // Find a cell by id.
    //
    findCell(cellId: string): ICellViewModel | undefined {
        const cellIndex = this.findCellIndex(cellId)
        if (cellIndex === undefined) {
            return undefined;
        }

        return this.cells[cellIndex];
    }

    //
    // Find the next cell after the requested cell, or null if no more cells.
    //
    findNextCell(cellId: string): ICellViewModel | undefined {
        const cellIndex = this.findCellIndex(cellId);
        if (cellIndex === undefined) {
            return undefined;
        }

        let nextCellIndex = cellIndex+1;
        if (nextCellIndex < this.cells.length) {
            return this.cells[nextCellIndex];
        }

        return undefined;
    }

    //
    // Find the prev cell before the requested cell, or undefined if no more cells.
    //
    findPrevCell(cellId: string): ICellViewModel | undefined {
        const cellIndex = this.findCellIndex(cellId);
        if (cellIndex === undefined) {
            return undefined;
        }

        let prevCellIndex = cellIndex-1;
        if (prevCellIndex >= 0) {
            return this.cells[prevCellIndex];
        }

        return undefined;
    }
   
    //
    // Get the first cell, or undefined if there are no cells.
    //
    getFirstCell(): ICellViewModel | undefined {
        if (this.cells.length > 0) {
            return this.cells[0];
        }

        return undefined;
    }

    //
    // Get the last cell, or undefined if there are no cells.
    //
    getLastCell(): ICellViewModel | undefined {
        if (this.cells.length > 0) {
            return this.cells[this.cells.length-1];
        }

        return undefined;
    }

    //
    // Event raised when the selected cell has changed.
    //
    onSelectedCellChanged: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();    

    //
    // Get the position of the caret in the notebook.
    //
    getCaretPosition(): INotebookCaretPosition | undefined {
        const selectedCell = this.selectedCell;
        if (selectedCell === undefined) {
            return undefined;
        }

        const selectedCellIndex = this.getSelectedCellIndex()!;
        const cellCaretPosition = selectedCell.getCaretPosition();
        if (cellCaretPosition === null) {
            return undefined;
        }

        const caretPosition: INotebookCaretPosition = {
            cellIndex: selectedCellIndex,
            cellPosition: cellCaretPosition,
        };
        return caretPosition;
    }

    //
    // Get the index of the currently selected cell in the notebook.
    //
    getSelectedCellIndex(): number | undefined {
        if (this.selectedCell === undefined) {
            return undefined;
        }

        return this.cells.indexOf(this.selectedCell);
    }

    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedNotebook1 {
        return {
            version: notebookVersion,
            description: this.description,
            cells: this.cells.map(cell => cell.serialize()),
        };
    }

    //
    // Serialize the notebook for evaluation. This excludes elements of the data that aren't needed for evaluation.
    //
    serializeForEval(): ISerializedNotebook1 {
        return {
            version: notebookVersion,
            cells: this.cells.map(cell => cell.serializeForEval()),
        };
    }

    //
    // Deserialize the model from a previously serialized data structure.
    //
    static deserialize(notebookStorageId: INotebookStorageId, unsaved: boolean, readOnly: boolean, input: ISerializedNotebook1): INotebookViewModel {
        let language: string;
        let cells: ICellViewModel[];
        if (input.sheet) {
            // This is preserved for backward compatibility and loading old notebooks.
            cells = input.sheet.cells && input.sheet.cells.map(cell => cellViewModelFactory(cell)) || [];
        }
        else {
            cells = input.cells && input.cells.map(cell => cellViewModelFactory(cell)) || [];
        }

        return new NotebookViewModel(notebookStorageId, cells, input.description, unsaved, readOnly);
    }    

    //
    // Saves the notebook.
    //
    async _save(notebookId: INotebookStorageId): Promise<void> {
        await this.flushChanges();

        const serialized = this.serialize();
        await this.notebookRepository.writeNotebook(serialized, notebookId);

        this.makeUnmodified();
    }

    //
    // Save the notebook to the current filename.
    //
    async save(): Promise<void> {

        if (this.readOnly) {
            throw new Error("The file for this notebook is readonly, it can't be saved this way.");
        }
        
        this.log.info("Saving notebook: " + this.storageId.displayName());

        if (this.unsaved) {
            throw new Error("Notebook has never been saved before, use saveAs function for the first save.");
        }

        await this._save(this.storageId);
        
        this.log.info("Saved notebook: " + this.storageId.displayName());
    }

    //
    // Save the notebook to a new location.
    //
    async saveAs(newNotebookId: INotebookStorageId): Promise<void> {
    
		this.log.info("Saving notebook as: " + newNotebookId.displayName());

		await this._save(newNotebookId);

        this.unsaved = false;
        this.storageId = newNotebookId;
        this.readOnly = false;
        
        this.log.info("Saved notebook: " + newNotebookId.displayName());
    }

    //
    // Clear all the outputs from the notebook.
    //
    async clearOutputs(): Promise<void> {
        for (const cell of this.cells) {
            await cell.clearOutputs();
        }

        this.modified = true;
    }

    //
    // Clear all errors from the notebook.
    //
    async clearErrors(): Promise<void> {
        for (const cell of this.cells) {
            await cell.clearErrors();
        }

        this.modified = true;
    }

    //
    // Notify the model it is about to be saved.
    //
    async flushChanges(): Promise<void> {
        await this.onFlushChanges.raise();

        for (const cell of this.cells) {
            await cell.flushChanges();
        }
    }

    //
    // Event raised before the model is saved.
    //
    onFlushChanges: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Start asynchronous evaluation of the notebook.
    //
    async notifyCodeEvalStarted(): Promise<void> {
        this.executing = true;
        for (const cell of this.cells) {
            cell.notifyNotebookEvalStarted();
        }
    }

    //
    // Stop asynchronous evaluation of the notebook.
    //
    async notifyCodeEvalComplete(): Promise<void> {
        this.executing = false;

        for (const cell of this.cells) {
            await cell.notifyCodeEvalComplete(); // Make sure all cells are no longer marked as executing.
        }
    }
}
