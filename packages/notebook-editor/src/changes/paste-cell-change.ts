
//
// A change that pastes a cell to a notebook.

import { InjectProperty, InjectableClass } from "@codecapers/fusion";
import { ISerializedCell1 } from "model";
import { IIdGeneratorId, IIdGenerator } from "utils";
import { IChange } from "../services/undoredo";
import { ICellViewModel } from "../view-model/cell";
import { INotebookViewModel, cellViewModelFactory } from "../view-model/notebook";

//
@InjectableClass()
export class PasteCellChange implements IChange {

    @InjectProperty(IIdGeneratorId)
    idGenerator!: IIdGenerator;
    
    private notebook: INotebookViewModel;
    private cellIndex: number; // The index where the cell is added.
    private cellClipboard: ISerializedCell1; // The cell to paste.
    private cell?: ICellViewModel; // The added cell.

    constructor(notebook: INotebookViewModel, cellIndex: number, cellClipboard: ISerializedCell1) {
        this.notebook = notebook;
        this.cellIndex = cellIndex;
        this.cellClipboard = cellClipboard;
    }

    //
    // Do a change.
    //
    async do(): Promise<void> {
        const cellToPaste = Object.assign({}, this.cellClipboard);
        cellToPaste.instanceId = this.idGenerator.genId(); // Give the new cell a new id.
        this.cell = cellViewModelFactory(cellToPaste);
        await this.notebook.addCell(this.cell, this.cellIndex);
        await this.notebook.select(this.cell);
    }

    //
    // Redo a change.
    //
    async redo(): Promise<void> {
        const cellToPaste = Object.assign({}, this.cellClipboard);
        cellToPaste.instanceId   = this.idGenerator.genId(); // Give the new cell a new id.
        this.cell = cellViewModelFactory(cellToPaste);
        await this.notebook.addCell(this.cell, this.cellIndex);
    }

    //
    // Undo a change that was made.
    //
    async undo(): Promise<void> {
        if (this.cell === undefined) {
            throw new Error("Cell has not be created.");
        }

        await this.notebook.deleteCell(this.cell, false);
    }

    //
    // Dump the state of the change.
    //
    dumpState(): string {
        return `Pasted cell at index ${this.cellIndex}`;
    }
    
}