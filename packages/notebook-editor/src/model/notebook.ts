import { ISerializedNotebook1 } from "./serialization/serialized1";
import { ICell, Cell } from "./cell";
import { v4 as uuid } from "uuid";

export const notebookVersion = 3;

//
// Represents the entire notebook.
//

export interface INotebook {

    //
    // Get the ID for this notebook instance.
    // This is not serialized and not persistant.
    //
    getInstanceId(): string;

    //
    // Get the language of the notebook.
    //
    getLanguage(): string;

    //
    // Get all cells in the notebook.
    //
    getCells(): ICell[];

    //
    // Add an existing cell to the notebook.
    //
    addCell(cellIndex: number, newCell: ICell): void;

    //
    // Delete the cell from the notebook.
    //
    deleteCell(cellId: string): void;

    //
    // Move a cell from one index to another.
    //
    moveCell(sourceIndex: number, destIndex: number): void;

    //
    // Find a cell by id.
    //
    findCell(cellId: string): ICell | null;
        
    //
    // Gets the Nodejs version for this notebook.
    //
    getNodejsVersion(): string | undefined;

    //
    // Sets the Nodejs version for this version.
    //
    setNodejsVersion(version: string): void;

    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize (): ISerializedNotebook1;
}

export class Notebook implements INotebook {

    //
    // The ID for this notebook instance.
    // This is not serialized and not persistant.
    //
    private instanceId: string = uuid();
    
    //
    // The Nodejs version for this notebook.
    //
    private nodejsVersion?: string;

    //
    // The language of the notebook.
    //
    private language: string;

    //
    // List of cells in the notebook.
    //
    private cells: ICell[];

    constructor(nodejsVersion: string | undefined, language: string, cells: ICell[]) {
        this.nodejsVersion = nodejsVersion;
        this.language = language;
        this.cells = cells;
    }
    
    //
    // Get the ID for this notebook instance.
    // This is not serialized and not persistant.
    //
    getInstanceId(): string {
        return this.instanceId;
    }
    
    //
    // Get the language of the notebook.
    //
    getLanguage(): string {
        return this.language;
    }

    //
    // Get all cells in the notebook.
    //
    getCells(): ICell[] {
        return this.cells;
    }

    //
    // Add an existing cell to the notebook.
    //
    addCell(cellIndex: number, newCell: ICell): void {
        if (cellIndex > this.cells.length) {
            throw new Error(`Bad index ${cellIndex} for new cell in notebook with ${this.cells.length} existing cells!`);
        }

        if (cellIndex === this.cells.length) {
            // Adding at end.
            this.cells.push(newCell);
        }
        else {
            this.cells.splice(cellIndex, 0, newCell)
        }
    }

    //
    // Delete the cell from the notebook.
    //
    deleteCell(cellId: string): void {
        const numCellsBefore = this.cells.length;
        this.cells = this.cells.filter(cell => cell.getId() !== cellId);
        const numCellsAfter = this.cells.length;
        const numCellsRemoved = numCellsBefore - numCellsAfter;
        if (numCellsRemoved !== 1) {
            throw new Error(`Expected only a single cell to be removed from notebook with ${numCellsBefore} cells, but removed ${numCellsRemoved} cells.`);
        }
    }

    //
    // Reorder cells.
    //
    moveCell(sourceIndex: number, destIndex: number): void {
        const reorderedCells = Array.from(this.cells);
        const [ movedCell ] = reorderedCells.splice(sourceIndex, 1);
        reorderedCells.splice(destIndex, 0, movedCell);
        this.cells = reorderedCells;
    }

    //
    // Find a cell by id.
    //
    findCell(cellId: string): ICell | null {
        for (const cell of this.cells) {
            if (cell.getId() === cellId) {
                return cell;
            }
        }

        return null;
    }    

    //
    // Gets the Nodejs version for this notebook.
    //
    getNodejsVersion(): string | undefined {
        return this.nodejsVersion;
    }

    //
    // Sets the Nodejs version for this version.
    //
    setNodejsVersion(version: string): void {
        this.nodejsVersion = version;
    }

    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize (): ISerializedNotebook1 {
        return {
            version: notebookVersion,
            nodejs: this.nodejsVersion,
            language: this.language,
            cells: this.cells.map(cell => cell.serialize()),
        };
    }

    //
    // Deserialize the model from a previously serialized data structure.
    //
    static deserialize(input: ISerializedNotebook1): INotebook {
        let language: string;
        let cells: ICell[];
        if (input.sheet) {
            // This is preserved for backward compatibility and loading old notebooks.
            language = input.sheet.language || "javascript";
            cells = input.sheet.cells && input.sheet.cells.map(cell => Cell.deserialize(cell)) || [];
        }
        else {
            language = input.language || "javascript";
            cells = input.cells && input.cells.map(cell => Cell.deserialize(cell)) || [];
        }

        return new Notebook(input.nodejs, language, cells);
    }
}
