import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { IDateProvider, IDateProviderId } from "../services/date-provider";
import { ICellViewModel, CellViewModel } from "./cell";
import { CellErrorViewModel, ICellErrorViewModel } from "./cell-error";
import { CellOutputViewModel, ICellOutputViewModel } from "./cell-output";
import moment from 'moment';
import { CellType, ISerializedCell1 } from "model";
import { action, observable } from "mobx";

//
// View-model for a code cell.
//
export interface ICodeCellViewModel extends ICellViewModel {

    //
    // Set to true when the code is currently executing.
    //
    executing: boolean;
    
    //
    // The output of code for the cell.
    //
    output: ICellOutputViewModel[];

    //
    // Index of the next slot for output.
    // This is used to place output while evaluating code.
    //
    nextOutputIndex: number;

    //
    // Error output for the cell.
    //
    errors: ICellErrorViewModel[];

    //
    // Index of the next slot for an error.
    // This is used to place errors while evaluating code.
    //
    nextErrorIndex: number;

    //
    // The date that the cell was last evaluated.
    //
    lastEvaluationDate?: Date;

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
    @observable
    executing: boolean = false;
    
    //
    // The output of code for the cell.
    //
    @observable
    output: ICellOutputViewModel[];

    //
    // Index of the next slot for output.
    // This is used to place output while evaluating code.
    //
    @observable
    nextOutputIndex: number = 0;

    //
    // Error output for the cell.
    //
    @observable
    errors: ICellErrorViewModel[];

    //
    // Index of the next slot for an error.
    // This is used to place errors while evaluating code.
    //
    @observable
    nextErrorIndex: number = 0;

    //
    // The date that the cell was last evaluated.
    //
    @observable
    lastEvaluationDate?: Date;

    constructor(id: string, cellType: CellType, text: string, lastEvaluationDate: Date | undefined, output: ICellOutputViewModel[], errors: ICellErrorViewModel[]) {
        super(id, cellType, text);

        this.lastEvaluationDate = lastEvaluationDate;
        this.output = output;
        this.errors = errors;

        for (const output of this.output) {
            this.hookOutputHandlers(output);
        }
    }

   
    //
    // The notebook has started executing.
    //
    @action
    notifyNotebookEvalStarted(): void {
        this.resetOutputs();
        this.resetErrors();
    }

    //
    // Start asynchonrous evaluation of the cell's code.
    //
    @action
    async notifyCodeEvalStarted(): Promise<void> {
        this.executing = true;
    }

    //
    // Notify the cell that code evaluation has completed.
    //
    @action
    async notifyCodeEvalComplete(): Promise<void> {

        if (this.executing) {
            // Was actually executing, update the last eval date.
            this.lastEvaluationDate = this.dateProvider.now();

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
    // Event raised when an output has been modified.
    //
    onOutputModified = async (): Promise<void> => {
        await this.notifyModified();
    }

    hookOutputHandlers(outputViewModel: ICellOutputViewModel): void {
        outputViewModel.onModified.attach(this.onOutputModified);
    }

    unhookOutputHandlers(outputViewModel: ICellOutputViewModel): void {
        if (outputViewModel) {
            outputViewModel.onModified.detach(this.onOutputModified);
        }
    }

    //
    // Add output to the cell.
    //
    @action
    async addOutput(output: ICellOutputViewModel): Promise<void> {

        this.hookOutputHandlers(output);

        if (this.output.length > this.nextOutputIndex) {

            const origOutput = this.output[this.nextOutputIndex];
            const origOutputHeight = origOutput.height;

            // Replace existing output.
            this.unhookOutputHandlers(origOutput);
            
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
        await this.onOutputChanged.raise();
    }

    //
    // Clear all the outputs from the cell.
    //
    @action
    async clearOutputs(): Promise<void> {

        for (const output of this.output) {
            this.unhookOutputHandlers(output);
        }
        
        this.nextOutputIndex = 0;
        this.output = [];

        await this.onOutputChanged.raise();
    }

    //
    // Reset the outputs of the cell.
    //
    @action
    resetOutputs(): void {
        this.nextOutputIndex = 0;
        for (const output of this.output) {
            output.markStale();
        }
    }

    //
    // Clear outputs that weren't updated.
    //
    @action
    clearStaleOutputs(): void {
        this.output = this.output.filter(output => output.fresh);
    }

    //
    // Add an error to the cell.
    //
    @action
    async addError(error: ICellErrorViewModel): Promise<void> {

        if (this.errors.length > this.nextErrorIndex) {
            // Replace existing output.
            this.errors[this.nextErrorIndex] = error;
        }
        else {
            this.errors = this.errors.concat([error]);
        }

        ++this.nextErrorIndex;
        
        await this.onErrorsChanged.raise();
    }

    //
    // Clear all the errors from the cell.
    //
    @action
    async clearErrors(): Promise<void> {

        this.nextErrorIndex = 0;
        this.errors = [];

        await this.onErrorsChanged.raise();
    }  

    //
    // Reset the errors of the cell.
    //
    @action
    resetErrors(): void {

        this.nextErrorIndex = 0;

        for (const error of this.errors) {
            error.markStale();
        }
    }

    //
    // Clear errors that weren't updated.
    //
    @action
    clearStaleErrors(): void {
        this.errors = this.errors.filter(error => error.fresh);
    }

    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedCell1 {
        return {
            ...super.serialize(),
            lastEvaluationDate: this.lastEvaluationDate && moment(this.lastEvaluationDate).toISOString(true) || undefined,
            output: this.output.map(output => output.serialize()),
            errors: this.errors.map(error => error.serialize()),
        };
    }    

    //
    // Deserialize the model from a previously serialized data structure.
    //
    static deserialize(input: ISerializedCell1): ICodeCellViewModel {
        const output = [];
        if (input.output) {
            //
            // Convert multi-outputs to single outputs.
            //
            for (const cellOutput of input.output) {
                if (cellOutput.value) {
                    output.push(CellOutputViewModel.deserialize(cellOutput));
                }
                else if (cellOutput.values) {
                    //
                    // This format can be deserialized for backward compatibility,
                    // but is no longer serialized.
                    //
                    for (const cellOutputValue of cellOutput.values) {
                        const singleOutput = Object.assign({}, cellOutput, { value: cellOutputValue });
                        delete singleOutput.values;
                        output.push(CellOutputViewModel.deserialize(singleOutput));
                    }
                }
            }
        }

        const lastEvaluationDate = input.lastEvaluationDate && moment(input.lastEvaluationDate, moment.ISO_8601).toDate() || undefined;

        return new CodeCellViewModel(
            input.id,
            input.cellType || CellType.Code,
            input.code || "",
            lastEvaluationDate,
            output,
            input.errors && input.errors.map(error => CellErrorViewModel.deserialize(error)) || [],
        );
    }       
}