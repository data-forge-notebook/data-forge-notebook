import { ICellOutput, CellOutput } from "./cell-output";
import { ICellError, CellError } from "./cell-error";
import { ISerializedCell1, ISerializedCellOutput1 } from "./serialization/serialized1";
import moment from 'moment';

export enum CellType {
    Code = "code",
    Markdown = "markdown",
}

export enum CellScope {
    Global = "global", // Default
    Local = "local",
}

//
// Represents a cell within a notebook notebook.
//
export interface ICell {

    //
    // Get the unique id for the cell.
    //
    getId(): string;

    //
    // Get the type of the cell.
    //
    getCellType(): CellType;

    //
    // Get the scope of the cell.
    //
    getCellScope(): CellScope | undefined;

    //
    // Set the scope of the cell.
    //
    setCellScope(scope: CellScope): void;
    
    //
    // Get the text for the cell.
    //
    getText(): string;

    //
    // Set the text for the cell.
    // Returns true if the text was changed.
    //
    setText(text: string): boolean;

    //
    // Gets the date when this cell last evaluated.
    //
    getLastEvaluationDate(): Date | undefined;

    //
    // Sets the last time the cell was evaluated.
    //
    setLastEvaluationDate(lastEvaluationDate: Date): void;

    //
    // Get the output for the cell.
    //
    getOutput(): ICellOutput[];

    //
    // Clear the output of the cell.
    //
    clearOutputs(): void;

    //
    // Reset the outputs of the cell.
    //
    resetOutputs(): void;

    //
    // Clear outputs that weren't updated.
    //
    clearStaleOutputs(): void;
    
    //
    // Add output to the cell.
    //
    addOutput(cellOutput: ICellOutput): void;

    //
    // Get errors from the cell.
    //
    getErrors(): ICellError[];

    //
    // Clear the errors of the cell.
    //
    clearErrors(): void;

    //
    // Reset the errors of the cell.
    //
    resetErrors(): void;

    //
    // Clear errors that weren't updated.
    //
    clearStaleErrors(): void;

    //
    // Add an error to the cell.
    //
    addError(cellError: ICellError): void;

    //
    // Gets the height of the cell (if recorded).
    //
    getHeight(): number | undefined;

    //
    // Sets the height of the cell (once known).
    //
    setHeight(height: number): void;

    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedCell1;
}

export class Cell implements ICell {

    //
    // Unique id for the cell.
    //
    private id: string;

    //
    // The type of the cell.
    //
    private cellType: CellType;

    //
    // The scope of the cell.
    //
    private cellScope: CellScope | undefined;
    
    //
    // The text for the cell.
    //
    private text: string;

    //
    // The output of evaluation of this cell.
    //
    private output: ICellOutput[];

    //
    // Index of the next slot for output.
    // This is used to place output while evaluating code.
    //
    private nextOutputIndex = 0;

    //
    // Error output for the cell.
    //
    private errors: ICellError[];
    
    //
    // Index of the next slot for an error.
    // This is used to place errors while evaluating code.
    //
    private nextErrorIndex = 0;

    //
    // The date that the cell was last evaluated.
    //
    private lastEvaluationDate?: Date;

    //
    // The height of the cell (if recorded).
    //
    height: number | undefined;

    constructor(id: string, cellType: CellType, cellScope: CellScope | undefined, text: string, lastEvaluationDate: string | undefined, height: number | undefined, output: ICellOutput[], errors: ICellError[]) {
        this.id = id;
        this.cellType = cellType;
        this.cellScope = cellScope;
        this.text = text;
        this.lastEvaluationDate = lastEvaluationDate && moment(lastEvaluationDate, moment.ISO_8601).toDate() || undefined;
        this.height = height;
        this.output = output;
        this.errors = errors;
    }

    //
    // Get the unique id for the cell.
    //
    getId(): string {
        return this.id;
    }
    
    //
    // Get the type of the cell.
    //
    getCellType(): CellType {
        return this.cellType;
    }

    //
    // Get the scope of the cell.
    //
    getCellScope(): CellScope | undefined {
        return this.cellScope;
    }

    //
    // Set the scope of the cell.
    //
    setCellScope(scope: CellScope): void {
        this.cellScope = scope;
    }    
    
    //
    // Get the text for the cell.
    //
    getText(): string {
        return this.text;
    }

    //
    // Set the txt for the cell.
    // Returns true if the text was changed.
    //
    setText(text: string): boolean {
        const trimmed = text.trimRight();
        if (this.text === trimmed) {
            return false; // No change.
        }

        this.text = trimmed;
        return true;
    }

    //
    // Gets the date when this cell last evaluated.
    //
    getLastEvaluationDate(): Date | undefined {
        return this.lastEvaluationDate;
    }

    //
    // Sets the last time the cell was evaluated.
    //
    setLastEvaluationDate(lastEvaluationDate: Date): void {
        this.lastEvaluationDate = lastEvaluationDate;
    }

    //
    // Get the output for the cell.
    //
    getOutput(): ICellOutput[] {
        return this.output;
    }

    //
    // Clear the output of the cell.
    //
    clearOutputs(): void {
        this.nextOutputIndex = 0;
        this.output = [];
    }

    //
    // Reset the outputs of the cell.
    //
    resetOutputs(): void {
        this.nextOutputIndex = 0;
        for (const output of this.output) {
            output.markStale();
        }
    }

    //
    // Clear outputs that weren't updated.
    //
    clearStaleOutputs(): void {
        this.output = this.output.filter(output => output.isFresh());
    }
    
    //
    // Add output to the cell.
    //
    addOutput(cellOutput: ICellOutput): void {

        if (this.output.length > this.nextOutputIndex) {
            // Replace existing output.
            this.output[this.nextOutputIndex] = cellOutput;
        }
        else {
            this.output = this.output.concat([cellOutput]);
        }

        ++this.nextOutputIndex;
    }
    
    //
    // Get errors from the cell.
    //
    getErrors(): ICellError[] {
        return this.errors;
    }

    //
    // Clear the errors of the cell.
    //
    clearErrors(): void {
        this.nextErrorIndex = 0;
        this.errors = [];
    }

    //
    // Reset the errors of the cell.
    //
    resetErrors(): void {
        this.nextErrorIndex = 0;
        for (const error of this.errors) {
            error.markStale();
        }
    }    

    //
    // Clear errors that weren't updated.
    //
    clearStaleErrors(): void {
        this.errors = this.errors.filter(error => error.isFresh());
    }

    //
    // Add an error to the cell.
    //
    addError(cellError: ICellError): void {

        if (this.errors.length > this.nextErrorIndex) {
            // Replace existing output.
            this.errors[this.nextErrorIndex] = cellError;
        }
        else {
            this.errors = this.errors.concat([cellError]);
        }

        ++this.nextErrorIndex;
    }

    //
    // Gets the height of the cell (if recorded).
    //
    getHeight(): number | undefined {
        return this.height;
    }

    //
    // Sets the height of the cell (once known).
    //
    setHeight(height: number): void {
        this.height = height;
    }
    
    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedCell1 {
        return {
            id: this.id,
            cellType: this.cellType,
            cellScope: this.cellType === CellType.Code && this.cellScope || undefined,
            code: this.text,
            lastEvaluationDate: this.lastEvaluationDate && moment(this.lastEvaluationDate).toISOString(true) || undefined,
            output: this.output.map(output => output.serialize()),
            errors: this.errors.map(error => error.serialize()),
            height: this.height,
        };
    }

    //
    // Deserialize the model from a previously serialized data structure.
    //
    static deserialize(input: ISerializedCell1): ICell {
        const output = [];
        if (input.output) {
            //
            // Convert multi-outputs to single outputs.
            //
            for (const cellOutput of input.output) {
                if (cellOutput.value) {
                    output.push(CellOutput.deserialize(cellOutput));
                }
                else if (cellOutput.values) {
                    //
                    // This format can be deserialized for backward compatibility,
                    // but is no longer serialized.
                    //
                    for (const cellOutputValue of cellOutput.values) {
                        const singleOutput = Object.assign({}, cellOutput, { value: cellOutputValue });
                        delete singleOutput.values;
                        output.push(CellOutput.deserialize(singleOutput));
                    }
                }
            }
        }

        return new Cell(
            input.id,
            input.cellType || CellType.Code,
            input.cellScope || CellScope.Global,
            input.code || "",
            input.lastEvaluationDate,
            input.height,
            output,
            input.errors && input.errors.map(error => CellError.deserialize(error)) || [],
        );
    }       
}