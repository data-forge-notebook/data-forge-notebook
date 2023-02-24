import { IFilePosition, ISourceMap } from "source-map-lib";

//
// Identifies a line in a cell.
//
export interface INotebookLocation {
    //
    // The Id for the cell.
    //
    cellId: string;

    //
    // The line number within the cell.
    //
    line: number;

    //
    // The column number within the cell.
    //
    column: number;
}

//
// Maps a line in generated code to a line in the notebook.
//
export function mapNotebookLocation(position: IFilePosition, sourceMap: ISourceMap): INotebookLocation | undefined {

    const sourceLocation = sourceMap.map(position);
    if (sourceLocation === undefined) {
        return undefined;
    }

    if (sourceLocation.source.startsWith("cell-")) {
        return { 
            cellId: sourceLocation.source.substring(5), 
            line: sourceLocation.position.line,
            column: sourceLocation.position.column,
        };
    }

    return undefined;
}
