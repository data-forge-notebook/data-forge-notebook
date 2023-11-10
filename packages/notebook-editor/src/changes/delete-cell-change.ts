
//
// A change that deletes a cell from a notebook.
//

import { InjectProperty, InjectableClass } from "@codecapers/fusion";
import assert from "assert";
import { IChange } from "../services/undoredo";
import { ICellViewModel } from "../view-model/cell";
import { INotebookViewModel } from "../view-model/notebook";
import { IIdGenerator, IIdGeneratorId } from "utils";

@InjectableClass()
export class DeleteCellChange implements IChange {
    
    @InjectProperty(IIdGeneratorId)
    idGenerator!: IIdGenerator;

    private notebook: INotebookViewModel;
    private cell: ICellViewModel; // The deleted cell.
    private cellIndex: number; // The index of the delete cell in the notebook.
    private selectNextCell: boolean; // Set to true to select next cell after deleted cell.

    constructor(notebook: INotebookViewModel, cell: ICellViewModel, selectNextCell: boolean) {
        this.notebook = notebook;
        this.cell = cell;
        this.selectNextCell = selectNextCell;
        this.cellIndex = this.notebook.getCellIndex(this.cell);
    }

    //
    // Do a change.
    //
    async do(): Promise<void> {
        assert(this.cellIndex >= 0, "Expected 0 or positive for deleted cell position.");
        this.notebook.deleteCell(this.cell, this.selectNextCell);
    }

    //
    // Redo a change.
    //
    async redo(): Promise<void> {
        assert(this.cellIndex >= 0, "Expected 0 or positive for deleted cell position.");
        this.notebook.deleteCell(this.cell, false);
    }

    //
    // Undo a change that was made.
    //
    async undo(): Promise<void> {
        if (this.cellIndex === undefined) {
            throw new Error("Expected deleted cell position in this.position to have been set by previous 'do' operation.");
        }

        this.notebook.addCell(this.cell, this.cellIndex)
    }

    //
    // Dump the state of the change.
    //
    dumpState(): string {
        return `Deleted cell ${this.cellIndex}.`;
    }
}