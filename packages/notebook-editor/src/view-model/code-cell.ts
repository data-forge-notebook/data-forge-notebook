import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { IDateProvider, IDateProviderId } from "../services/date-provider";
import { ICellViewModel, CellViewModel } from "./cell";
import { CellErrorViewModel, ICellErrorViewModel } from "./cell-error";
import { CellOutputViewModel, ICellOutputViewModel } from "./cell-output";
import { CellOutputValueViewModel } from "./cell-output-value";
import moment from 'moment';
import { CellType, ISerializedCell1 } from "model";

//
// View-model for a code cell.
//
export interface ICodeCellViewModel extends ICellViewModel {

    //
    // Returns true when the code is currently executing.
    //
    isExecuting(): boolean;

    //
    // Gets the date when this code last evaluated.
    //
    getLastEvaluationDate(): Date | undefined;

    //
    // Returns true when the code is known to be in error.
    //
    inError(): boolean;

    //
    // Get the output for the cell.
    //
    getOutput(): ICellOutputViewModel[];

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
    // Get errors from the cell.
    //
    getErrors(): ICellErrorViewModel[];

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

    //
    // Gets the date when this cell last evaluated.
    //
    getLastEvaluationDate(): Date | undefined;

    //
    // Sets the last time the cell was evaluated.
    //
    setLastEvaluationDate(lastEvaluationDate: Date): void;
}

@InjectableClass()
export class CodeCellViewModel extends CellViewModel implements ICellViewModel {

    @InjectProperty(IDateProviderId)
    dateProvider!: IDateProvider;

    //
    // Set to true when the code is currently executing.
    //
    private executing: boolean = false;
    
    //
    // The output of code for the cell.
    //
    private output: ICellOutputViewModel[];

    //
    // Index of the next slot for output.
    // This is used to place output while evaluating code.
    //
    private nextOutputIndex = 0;

    //
    // Error output for the cell.
    //
    private errors: ICellErrorViewModel[];

    //
    // Index of the next slot for an error.
    // This is used to place errors while evaluating code.
    //
    private nextErrorIndex = 0;

    //
    // The date that the cell was last evaluated.
    //
    private lastEvaluationDate?: Date;

    constructor(id: string, cellType: CellType, text: string, lastEvaluationDate: string | undefined, height: number | undefined, output: ICellOutputViewModel[], errors: ICellErrorViewModel[]) {
        super(id, cellType, text, height);

        this.lastEvaluationDate = lastEvaluationDate && moment(lastEvaluationDate, moment.ISO_8601).toDate() || undefined;
        this.output = output;
        this.errors = errors;

        for (const output of this.output) {
            this.hookOutputHandlers(output);
        }
    }

    //
    // Returns true when the code is currently executing.
    //
    isExecuting(): boolean {
        return this.executing;
    }

    //
    // Returns true when the code is known to be in error.
    //
    inError(): boolean {
        return this.errors && this.errors.length > 0;
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
        await this.onEvalStarted.raise();
    }

    //
    // Notify the cell that code evaluation has compled.
    //
    async notifyCodeEvalComplete(): Promise<void> {

        if (this.executing) {
            // Was actually executing, update the last eval date.
            this.setLastEvaluationDate(this.dateProvider.now());

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
        await this.onEvalCompleted.raise();
    }

    //
    // Get the output for the cell.
    //
    getOutput(): ICellOutputViewModel[] {
        return this.output;
    }

    //
    // Event raised when an output has been modified.
    //
    private onOutputModified = async (): Promise<void> => {
        await this.notifyModified();
    }

    private hookOutputHandlers(outputViewModel: ICellOutputViewModel): void {
        outputViewModel.onModified.attach(this.onOutputModified);
    }

    private unhookOutputHandlers(outputViewModel: ICellOutputViewModel): void {
        if (outputViewModel) {
            outputViewModel.onModified.detach(this.onOutputModified);
        }
    }

    //
    // Add output to the cell.
    //
    async addOutput(output: ICellOutputViewModel): Promise<void> {

        const outputValue = output.getValue();
        const valueViewModel = new CellOutputValueViewModel(outputValue.getDisplayType(), outputValue.getPlugin(), outputValue.getData());
        const outputViewModel = new CellOutputViewModel(valueViewModel, output.getHeight());
        this.hookOutputHandlers(outputViewModel);

        if (this.output.length > this.nextOutputIndex) {

            const origOutput = this.output[this.nextOutputIndex];
            const origOutputHeight = origOutput.getHeight();

            // Replace existing output.
            this.unhookOutputHandlers(origOutput);
            
            this.output[this.nextOutputIndex] = outputViewModel;
            if (origOutputHeight !== undefined) {
                if (origOutput.getValue().getDisplayType() === output.getValue().getDisplayType()) {
                    // Preserve the height the user selected for this output, but only if the display type is the same.
                    this.output[this.nextOutputIndex].setHeight(origOutputHeight);
                }
            }
        }
        else {
            this.output = this.output.concat([outputViewModel]);
        }

        ++this.nextOutputIndex;
        await this.onOutputChanged.raise();
    }

    //
    // Clear all the outputs from the cell.
    //
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
    // Get errors from the cell.
    //
    getErrors(): ICellErrorViewModel[] {
        return this.errors;
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
        
        await this.onErrorsChanged.raise();
    }

    //
    // Clear all the errors from the cell.
    //
    async clearErrors(): Promise<void> {

        this.nextErrorIndex = 0;
        this.errors = [];

        await this.onErrorsChanged.raise();
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

        return new CodeCellViewModel(
            input.id,
            input.cellType || CellType.Code,
            input.code || "",
            input.lastEvaluationDate,
            input.height,
            output,
            input.errors && input.errors.map(error => CellErrorViewModel.deserialize(error)) || [],
        );
    }       
}