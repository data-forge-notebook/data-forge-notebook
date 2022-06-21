
//
// The position of the caret within a notebook.
//

import { IEditorCaretPosition } from "./editor-caret-position";

//
export interface INotebookCaretPosition {
    //
    // The cell that has the caret.
    //
    readonly cellIndex: number;

    //
    // The position of the caret in the cell.
    //
    readonly cellPosition: IEditorCaretPosition;
}
