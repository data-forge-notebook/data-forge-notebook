import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { ICell, ICellError, ICellOutput } from "model";
import { IDateProvider, IDateProviderId } from "../services/date-provider";
import { ICellViewModel, CellViewModel } from "./cell";
import { CellErrorViewModel, ICellErrorViewModel } from "./cell-error";
import { CellOutputViewModel, ICellOutputViewModel } from "./cell-output";
import { CellOutputValueViewModel } from "./cell-output-value";

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
    addOutput(output: ICellOutput): Promise<void>;

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
    addError(error: ICellError): Promise<void>;

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

    constructor(cell: ICell, output: ICellOutputViewModel[], errors: ICellErrorViewModel[]) {
        super(cell)

        this.output = output;

        for (const output of this.output) {
            this.hookOutputHandlers(output);
        }

        this.errors = errors;
    }

    //
    // Returns true when the code is currently executing.
    //
    isExecuting(): boolean {
        return this.executing;
    }

    //
    // Gets the date when this code last evaluated.
    //
    getLastEvaluationDate(): Date | undefined {
        return this.cell.getLastEvaluationDate();
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
            this.cell.setLastEvaluationDate(this.dateProvider.now());

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
    async addOutput(output: ICellOutput): Promise<void> {
        this.cell.addOutput(output);

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

        this.cell.clearOutputs();
        await this.onOutputChanged.raise();
    }

    //
    // Reset the outputs of the cell.
    //
    resetOutputs(): void {
        this.cell.resetOutputs();
        this.nextOutputIndex = 0;
        for (const output of this.output) {
            output.markStale();
        }
    }

    //
    // Clear outputs that weren't updated.
    //
    clearStaleOutputs(): void {
        this.cell.clearStaleOutputs();
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
    async addError(error: ICellError): Promise<void> {
        this.cell.addError(error);

        const errorViewModel = new CellErrorViewModel(error.getMsg()); //todo:

        if (this.errors.length > this.nextErrorIndex) {
            // Replace existing output.
            this.errors[this.nextErrorIndex] = errorViewModel;
        }
        else {
            this.errors = this.errors.concat([errorViewModel]);
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

        this.cell.clearErrors();
        await this.onErrorsChanged.raise();
    }  

    //
    // Reset the errors of the cell.
    //
    resetErrors(): void {
        this.cell.resetErrors();
        this.nextErrorIndex = 0;
        for (const error of this.errors) {
            error.markStale();
        }
    }

    //
    // Clear errors that weren't updated.
    //
    clearStaleErrors(): void {
        this.cell.clearStaleErrors();
        this.errors = this.errors.filter(error => error.isFresh());
    }
}