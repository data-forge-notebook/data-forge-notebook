import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { IDateProvider, IDateProviderId } from "../services/date-provider";
import { ICellViewModel, CellViewModel } from "./cell";
import { CellErrorViewModel, ICellErrorViewModel } from "./cell-error";
import { CellOutputViewModel, ICellOutputViewModel } from "./cell-output";
import moment from 'moment';
import { CellType, ISerializedCell1 } from "model";
import { action, computed, makeObservable, observable, reaction } from "mobx";

//
// View-model for a code cell.
//
export interface ICodeCellViewModel extends ICellViewModel {

    //
    // Set to true when the code is currently executing.
    //
    readonly executing: boolean;
    
    //
    // The output of code for the cell.
    //
    readonly output: ICellOutputViewModel[];

    //
    // Index of the next slot for output.
    // This is used to place output while evaluating code.
    //
    readonly nextOutputIndex: number;

    //
    // Error output for the cell.
    //
    readonly errors: ICellErrorViewModel[];

    //
    // Index of the next slot for an error.
    // This is used to place errors while evaluating code.
    //
    readonly nextErrorIndex: number;

    //
    // Add output to the cell.
    //
    addOutput(output: ICellOutputViewModel): Promise<void>;

    //
    // Clear all the outputs from the cell.
    //
    clearOutputs(): Promise<void>;

    //
    // Reset the outputs of the cell.
    //
    resetOutputs(): void;

    //
    // Clear outputs that weren't updated.
    //
    clearStaleOutputs(): void;

    //
    // Add an error to the cell.
    //
    addError(error: ICellErrorViewModel): Promise<void>;

    //
    // Clear all the errors from the cell.
    //
    clearErrors(): Promise<void>;

    //
    // Reset the errors of the cell.
    //
    resetErrors(): void;

    //
    // Clear errors that weren't updated.
    //
    clearStaleErrors(): void;
}

@InjectableClass()
export class CodeCellViewModel extends CellViewModel implements ICellViewModel {

    @InjectProperty(IDateProviderId)
    dateProvider!: IDateProvider;

    //
    // Set to true when the code is currently executing.
    //
    executing: boolean = false;
    
    //
    // The output of code for the cell.
    //
    output: ICellOutputViewModel[];

    //
    // Index of the next slot for output.
    // This is used to place output while evaluating code.
    //
    nextOutputIndex: number = 0;

    //
    // Error output for the cell.
    //
    errors: ICellErrorViewModel[];

    //
    // Index of the next slot for an error.
    // This is used to place errors while evaluating code.
    //
    nextErrorIndex: number = 0;

    constructor(instanceId: string | undefined, cellType: CellType, text: string, output: ICellOutputViewModel[], errors: ICellErrorViewModel[]) {
        super(instanceId, cellType, text);

        this.output = output;
        this.errors = errors;

        makeObservable(this, {
            executing: observable,
            output: observable,
            nextOutputIndex: observable,
            errors: observable,
            nextErrorIndex: observable,
            notifyNotebookEvalStarted: action,
            notifyCodeEvalStarted: action,
            notifyCodeEvalComplete: action,
            addOutput: action,
            clearOutputs: action,
            resetOutputs: action,
            clearStaleOutputs: action,
            addError: action,
            clearErrors: action,
            resetErrors: action,
            clearStaleErrors: action,
        });

        reaction(() => this.output, () => {
            this.modified = true;
        });

        reaction(() => this.errors, () => {
            this.modified = true;
        });
    }

    //
    // Returns true when the cell or children have been modified.
    //
    get isModified(): boolean {
        if (super.isModified) {
            return true;
        }

        for (const output of this.output) {
            if (output.modified) {
                return true;
            }
        }

        return false;
    }

    //
    // Mark the entire model as unodified.
    //
    makeUnmodified(): void {
        super.makeUnmodified();

        for (const output of this.output) {
            output.makeUnmodified();
        }
    }

    //
    // The notebook has started executing.
    //
    notifyNotebookEvalStarted(): void {
        this.resetOutputs();
        this.resetErrors();
    }

    //
    // Start asynchonrous evaluation of the cell's code.
    //
    async notifyCodeEvalStarted(): Promise<void> {
        this.executing = true;
    }

    //
    // Notify the cell that code evaluation has completed.
    //
    async notifyCodeEvalComplete(): Promise<void> {

        if (this.executing) {
            // Only clear output and errors if the cell was executing.
            // This has to be done in the if-stmt here so that running a single code cell 
            // doesn't cause outputs and errors to be stripped from all cells.
            this.clearStaleOutputs();
            this.clearStaleErrors();
        }

        //
        // This code gets executed whether the cell was evaluted or not.
        //
        this.executing = false;
    }

    //
    // Add output to the cell.
    //
    async addOutput(output: ICellOutputViewModel): Promise<void> {

        if (this.output.length > this.nextOutputIndex) {

            const origOutput = this.output[this.nextOutputIndex];
            const origOutputHeight = origOutput.height;
           
            this.output[this.nextOutputIndex] = output;
            if (origOutputHeight !== undefined) {
                if (origOutput.value.displayType === output.value.displayType) {
                    // Preserve the height the user selected for this output, but only if the display type is the same.
                    this.output[this.nextOutputIndex].setHeight(origOutputHeight);
                }
            }
        }
        else {
            this.output = this.output.concat([output]);
        }

        ++this.nextOutputIndex;
    }

    //
    // Clear all the outputs from the cell.
    //
    async clearOutputs(): Promise<void> {

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
        this.output = this.output.filter(output => output.fresh);
    }

    //
    // Add an error to the cell.
    //
    async addError(error: ICellErrorViewModel): Promise<void> {

        if (this.errors.length > this.nextErrorIndex) {
            // Replace existing output.
            this.errors[this.nextErrorIndex] = error;
        }
        else {
            this.errors = this.errors.concat([error]);
        }

        ++this.nextErrorIndex;
    }

    //
    // Clear all the errors from the cell.
    //
    async clearErrors(): Promise<void> {

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
        this.errors = this.errors.filter(error => error.fresh);
    }
}