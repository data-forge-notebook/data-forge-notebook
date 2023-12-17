import { makeAutoObservable } from "mobx";
import { v4 as uuid } from "uuid";

//
// View-model for an error from a cell.
//

export interface ICellErrorViewModel {

    //
    // Instance ID of the model.
    // Not serialized.
    //
    readonly instanceId: string;

    //
    // The error message.
    //
    readonly msg: string;

    //
    // The output is fresh when true, out of date when false.
    //
    readonly fresh: boolean;

    //
    // Mark the output as out of data.
    //
    markStale(): void;
}

export class CellErrorViewModel implements ICellErrorViewModel {

    //
    // Instance ID of the model.
    // Not serialized.
    //
    readonly instanceId: string;

    //
    // The error message.
    //
    readonly msg: string;

    //
    // The output is fresh when true, out of date when false.
    //
    fresh: boolean = true;

    constructor (msg: string) {
        this.instanceId = uuid();
        this.msg = msg;

        makeAutoObservable(this);
    }

    //
    // Mark the output as out of data.
    //
    markStale(): void {
        this.fresh = false;
    }
}