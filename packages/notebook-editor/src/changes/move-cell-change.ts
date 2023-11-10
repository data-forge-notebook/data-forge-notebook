//
// A change that moves a cell from one position to another in the sheet.
//

import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { IIdGeneratorId, IIdGenerator } from "utils";
import { IChange } from "../services/undoredo";
import { INotebookViewModel } from "../view-model/notebook";

@InjectableClass()
export class MoveCellChange implements IChange {
    
    @InjectProperty(IIdGeneratorId)
    idGenerator!: IIdGenerator;

    notebook: INotebookViewModel;
    sourceIndex: number; // The location to move from.
    destIndex: number; // The location to move to.

    constructor(notebook: INotebookViewModel, sourceIndex: number, destIndex: number) {
        this.notebook = notebook;
        this.sourceIndex = sourceIndex;
        this.destIndex = destIndex
    }

    //
    // Do a change.
    //
    async do(): Promise<void> {
        console.log(`Doing cell move, moving cell #${this.sourceIndex} to #${this.destIndex}.`);
        this.notebook.moveCell(this.sourceIndex, this.destIndex);
    }

    //
    // Redo a change.
    //
    async redo(): Promise<void> {
        await this.do();
    }

    //
    // Undo a change that was made.
    //
    async undo(): Promise<void> {
        console.log(`Undoing cell move, putting cell #${this.destIndex} back to #${this.sourceIndex}.`);
        this.notebook.moveCell(this.destIndex, this.sourceIndex);
    }

    //
    // Dump the state of the change.
    //
    dumpState(): string {
        return `Moved cell from ${this.sourceIndex} to ${this.destIndex}.`;
    }
}