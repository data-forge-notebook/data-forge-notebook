
//
// Changes the text of a notebook.
//

import { IChange } from "../services/undoredo";
import { ICellViewModel } from "../view-model/cell";

export class CellTextChange implements IChange {

    cell: ICellViewModel;
    oldCellText?: string;
    newCellText: string;

    constructor(cell: ICellViewModel, newCellText: string) {
        this.cell = cell;
        this.newCellText = newCellText;
    }

    //
    // Do a change.
    //
    async do(): Promise<void> {
        this.oldCellText = this.cell.text;
        this.cell.setText(this.newCellText);
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
        if (this.oldCellText === undefined) {
            throw new Error("this.oldCellText should have been set by previous 'do' operation.");
        }
        this.cell.setText(this.oldCellText);
    }

    //
    // Dump the state of the change.
    //
    dumpState(): string {
        return `Changed cell text from "${this.oldCellText}" to "${this.newCellText}".`;
    }
    
}