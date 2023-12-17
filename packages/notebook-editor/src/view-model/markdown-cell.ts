import { CellType, ISerializedCell1 } from "model";
import { ICellViewModel, CellViewModel } from "./cell";
import { action, makeObservable, observable } from "mobx";

//
// Represents a cell within a notebook.
//
export interface IMarkdownCellViewModel extends ICellViewModel {

    //
    // Set to true when the markdown cell is in editing mode.
    //
    readonly editing: boolean;

    //
    // Switch the markdown cell to edit mode.
    //
    enterEditMode(): Promise<void>;

    //
    // Switch the markdown cell to preview mode.
    //
    enterPreviewMode(): Promise<void>;
}

export class MarkdownCellViewModel extends CellViewModel implements IMarkdownCellViewModel {

    //
    // Set to true when the markdown cell is in editing mode.
    //
    editing: boolean;

    constructor(instanceId: string | undefined, cellType: CellType, text: string) {
        super(instanceId, cellType, text);

        this.editing = false;

        makeObservable(this, {
            editing: observable,
            enterEditMode: action,
            enterPreviewMode: action,        
        });
    }

    //
    // Switch the markdown cell to edit mode.
    //
    async enterEditMode(): Promise<void> {
        this.editing = true;
    }

    //
    // Switch the markdown cell to preview mode.
    //
    async enterPreviewMode(): Promise<void> {
        if (!this.editing) {
            return; // Already in preview mode.
        }

        // Flush code changes when changing from edit to preview mode.
        await this.flushChanges();

        this.editing = false;
    }

    //
    // The notebook has started executing.
    //
    notifyNotebookEvalStarted(): void {
        // Only implemented for code cells.
    }

    //
    // Start asynchonrous evaluation of the cell's code.
    //
    async notifyCodeEvalStarted(): Promise<void> {
        // Only implemented for code cells.
    }

    //
    // Notify the cell that code evaluation has completed.
    //
    async notifyCodeEvalComplete(): Promise<void> {
        // Only implemented for code cells.
    }

    //
    // Clear all the outputs from the cell.
    //
    async clearOutputs(): Promise<void> {
        // Only implemented for code cells.
    }

    //
    // Clear all the errors from the cell.
    //
    async clearErrors(): Promise<void> {
        // Only implemented for code cells.
    }
}