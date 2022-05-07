
//
// The position of the caret in the editor.
//
export interface IEditorCaretPosition {
    //
    // line number (starts at 1)
    //
    readonly lineNumber: number;

    //
    // column (the first character in a line is between column 1 and column 2)
    //
    readonly column: number;
}
