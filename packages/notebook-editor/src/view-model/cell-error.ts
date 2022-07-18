import { ICellError } from "model";

//
// View-model for an error from a cell.
//

export interface ICellErrorViewModel {

    //
    // Get the model under the view model.
    //
    getModel(): ICellError;

    //
    // Get the (non-serialized) instance ID.
    //
    getInstanceId(): string;

    //
    // Get the message from the error.
    //
    getMsg(): string;

    //
    // Returns true if this is fresh output.
    //
    isFresh(): boolean;

    //
    // Mark the output as out of data.
    //
    markStale(): void;
}

export class CellErrorViewModel implements ICellErrorViewModel {

    //
    // The model underlying the view-model.
    //
    private readonly cellError: ICellError;

    //
    // The output is fresh when true, out of date when false.
    //
    private fresh: boolean = true;
    
    constructor (cellError: ICellError) {
        this.cellError = cellError;
    }

    //
    // Get the model under the view model.
    //
    getModel(): ICellError {
        return this.cellError;
    }

    //
    // Get the (non-serialized) instance ID.
    //
    getInstanceId(): string {
        return this.cellError.getInstanceId();
    }

    //
    // Get the message from the error.
    //
    getMsg(): string {
        return this.cellError.getMsg();
    }
    
    //
    // Returns true if this is fresh output.
    //
    isFresh(): boolean {
        return this.fresh;
    }

    //
    // Mark the output as out of data.
    //
    markStale(): void {
        this.fresh = false;
    }
}