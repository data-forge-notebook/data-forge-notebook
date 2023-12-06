
//
// A change that adds a cell to a notebook.

import { InjectProperty, InjectableClass } from "@codecapers/fusion";
import { CellType, ISerializedCell1 } from "model";
import { IChange } from "../services/undoredo";
import { ICellViewModel } from "../view-model/cell";
import { INotebookViewModel, cellViewModelFactory } from "../view-model/notebook";
import { IIdGenerator, IIdGeneratorId } from "utils";

//
@InjectableClass()
export class AddCellChange implements IChange {
    
    @InjectProperty(IIdGeneratorId)
    idGenerator!: IIdGenerator;

    private notebook: INotebookViewModel;
    private cellIndex: number; // The index where the cell is added.
    private cellCode: string; // Initial code for the cell.
    private cellType: CellType; // The type of cell to add.
    private cell?: ICellViewModel; // The added cell.
    private selectCell: boolean; // Set to true to select the new cell.

    constructor(notebook: INotebookViewModel, cellIndex: number, cellCode: string, cellType: CellType, selectCell: boolean) {
        this.notebook = notebook;
        this.cellIndex = cellIndex;
        this.cellCode = cellCode;
        this.cellType = cellType;
        this.selectCell = selectCell
    }

    //
    // Do a change.
    //
    async do(): Promise<void> {
        const cellToAdd: ISerializedCell1 = {
            id: this.idGenerator.genId(),
            cellType: this.cellType,
            code: this.cellCode,
        };

        this.cell = cellViewModelFactory(cellToAdd);
        await this.notebook.addCell(this.cell, this.cellIndex);
        if (this.selectCell) {
            await this.notebook.select(this.cell);
        }
    }

    //
    // Redo a change.
    //
    async redo(): Promise<void> {
        const cellToAdd: ISerializedCell1 = {
            id: this.idGenerator.genId(),
            cellType: this.cellType,
            code: this.cellCode,
        };

        this.cell = cellViewModelFactory(cellToAdd);
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
        return `Added cell ${this.cellType} at index ${this.cellIndex}`;
    }
    
}