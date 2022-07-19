import * as async_hooks from "async_hooks";
import * as fs from "fs";
import { Resolver } from "dns";

const hackWorkaround = new Resolver();

//
// Helper for tracking asynchronous operations.
//

export interface IAsyncTracker {

    //
    // Initialise the tracker.
    //
    init(): void;

    //
    // Deinitialize the tracker.
    //
    deinit(): void;

    //
    // Returns true to indicate still tracking, false to indicate deactivated.
    //
    isTracking(): boolean;

    //
    // Start tracking async operations for a cell.
    //
    trackCell(cellAsyncId: number, cellIndex: number): void;

    //
    // Get the id of the cell for a given async operation.
    //
    findCellIndex(asyncId: number): number | undefined;

    //
    // Determine a given cell has completed all async operatins.
    //
    hasCellCompleted(cellIndex: number): boolean;

    //
    // The number of in-flight async operations.
    //
    getNumAsyncOps(): number;

    //
    // Is the requested async operating contained in this context.
    //
    inContext(asyncId: number): boolean;

    //
    // Dump a debug representation.
    //
    dump(): string;
}

export class NullAsyncTracker implements IAsyncTracker {

    //
    // Initialise the tracker.
    //
    init(): void {

    }

    //
    // Deinitialize the tracker.
    //
    deinit(): void {

    }

    //
    // Returns true to indicate still tracking, false to indicate deactivated.
    //
    isTracking(): boolean {
        return false;
    }

    //
    // Start tracking async operations for a cell.
    //
    trackCell(cellAsyncId: number, cellIndex: number): void {
    }

    //
    // Get the id of the cell for a given async operation.
    //
    findCellIndex(asyncId: number): number | undefined {
        return undefined;
    }

    //
    // Determine a given cell has completed all async operatins.
    //
    hasCellCompleted(cellIndex: number): boolean {
        return true;
    }

    //
    // The number of in-flight async operations.
    //
    getNumAsyncOps(): number {
        return 0;
    }

    //
    // Is the requested async operating contained in this context.
    //
    inContext(asyncId: number): boolean {
        return false;
    }

    //
    // Dump a debug representation.
    //
    dump(): string {
        return "";
    }

}

export interface IAsyncOp {
    asyncId: number;
    type: string;
    triggerAsyncId: number;
    // Debugging.
    // createdStack: string[];
    // resolvedStack?: string[];
    children: Map<number, IAsyncOp>;
    
    // 
    // Status of the async operation.
    //
    status: string;

    //
    // Identifies the cell that owns this async operation.
    //
    cellIndex: number;
}

export class AsyncTracker implements IAsyncTracker {

    curAsyncOps = new Map<number, IAsyncOp>();
    allAsyncOps = new Map<number, IAsyncOp>();
    rootOps = new Map<number, IAsyncOp>();
    asyncIdToCellIndexMap = new Map<number, number>();
    numCellOps = new Map<number, number>();
    
    asyncHook?: async_hooks.AsyncHook;

    //
    // Initialise the tracker.
    //
    init(): void {

        if (this.asyncHook) {
            return; // Already initialized.
        }

        // fs.writeSync(1, `%% ** Init tracker!\n`);

        //
        // Create the async hook.
        //
        this.asyncHook = async_hooks.createHook({ 
            init: (asyncId, type, triggerAsyncId, resource) => {
                // fs.writeSync(1, `%% considering ${asyncId} (type = ${type}, parent = ${triggerAsyncId} resource = ${typeof(resource)})\n`);
                this.addAsyncOperation(asyncId, type, triggerAsyncId, resource);
            },
            // before: asyncId => {
            //     if (trackAsyncOperations) {
            //         fs.writeSync(1, `%% before ${asyncId}\n`);
            //     }
            // },
            after: asyncId => {
                // fs.writeSync(1, `%% after ${asyncId}\n`);
                // this.removeAsyncOperation(asyncId);
            },
            destroy: asyncId => {
                // fs.writeSync(1, `%% destroy ${asyncId}\n`);
                this.removeAsyncOperation(asyncId, "it was destroyed");
            },
            promiseResolve: asyncId => {
                // fs.writeSync(1, `%% promiseResolve ${asyncId}\n`);
                this.removeAsyncOperation(asyncId, "it was resolved");
            },
        });

        this.asyncHook.enable();
    }
    
    //
    // Deinitialize the tracker.
    //
    deinit(): void {
        if (this.asyncHook) {
            // fs.writeSync(1, `%% ** Deinit tracker!\n`);
            this.asyncHook.disable();
            delete this.asyncHook;
        }
    }

    //
    // Returns true to indicate still tracking, false to indicate deactivated.
    //
    isTracking(): boolean {
        return this.asyncHook !== undefined;
    }    

    //
    // Start tracking async operations for a cell.
    //
    public trackCell(cellAsyncId: number, cellIndex: number): void {
        this.asyncIdToCellIndexMap.set(cellAsyncId, cellIndex);
    }

    //
    // Get the id of the cell for a given async operation.
    //
    findCellIndex(asyncId: number): number | undefined {
        const cellIndex = this.asyncIdToCellIndexMap.get(asyncId);
        if (cellIndex !== undefined) {
            return cellIndex;
        }
        
        const asyncOp = this.allAsyncOps.get(asyncId);
        if (asyncOp) {
            return this.findCellIndex(asyncOp.triggerAsyncId);
        }

        return undefined;
    }

    //
    // Determine a given cell has completed all async operatins.
    //
    hasCellCompleted(cellIndex: number): boolean {
        return (this.numCellOps.get(cellIndex) || 0) <= 0;
    }

    //
    // Returns true if an async operation or any of it's parents is tracked.
    //
    private getCellIndexForOp(asyncId: number): number | undefined {
        const cellIndex = this.asyncIdToCellIndexMap.get(asyncId);
        if (cellIndex !== undefined) {
            return cellIndex;
        }

        const asyncOp = this.allAsyncOps.get(asyncId);
        if (asyncOp) {
            return this.getCellIndexForOp(asyncOp.triggerAsyncId);
        }

        return undefined;
    }

    //
    // Add an async operation.
    //
    private addAsyncOperation(asyncId: number, type: string, triggerAsyncId: number, resource: any): void {

        if (type === "TLSWRAP") {
            // I'm forced to just ignore these.
            // They don't seem to be destroyed (~AsyncWrap destructor in Node.js code).
            // I'm not sure why or how to force them to be destroyed. So will just no track them for now.
            return;
        }

        if (type === "__async_context") {
            // This is an async resource that's used purely to wrap async operations for tracking,
            // it's easiest just to ignore this because it doesn't represent user trackable operations.
            return;
        }

        const cellIndex = this.getCellIndexForOp(triggerAsyncId);
        if (cellIndex !== undefined) {
            // The triggering async operation has been traced back to a particular cell.

            // Attach every async operation the cell to avoid an expensive recursive walk in getCellIndexForOp.
            this.trackCell(asyncId, cellIndex);

            // Debugging.
            // const error: any = {};
            // Error.captureStackTrace(error);
            // Error.stackTraceLimit = Infinity;

            // const stack = (error.stack as string).split("\n").map(line => line.trim());
            
            const asyncOp: IAsyncOp = {
                asyncId,
                type,
                triggerAsyncId,
                children: new Map<number, IAsyncOp>(),
                // Debugging.
                //createdStack: stack,
                status: "in-flight",
                cellIndex,
            };

            const parentOperation = this.allAsyncOps.get(triggerAsyncId);
            if (parentOperation) {
                parentOperation.children.set(asyncId, asyncOp);
            }
            else {
                this.rootOps.set(asyncId, asyncOp);
            }

            this.curAsyncOps.set(asyncId, asyncOp);
            this.allAsyncOps.set(asyncId, asyncOp);

            //
            // Track the async operations for each cell so we know when that cell is finished.
            //
            this.numCellOps.set(cellIndex, (this.numCellOps.get(cellIndex) || 0) + 1);
            
            // fs.writeSync(1, `%% init ${asyncId}, type = ${type}, parent = ${triggerAsyncId}, cell = ${cellIndex}, #cellops = ${this.numCellOps.get(cellIndex)}, #ops = ${this.curAsyncOps.size}\n`);
            // fs.writeSync(1, `-- stack\n${stack.join('\n')}\n`);
        }
    }

    //
    // Remove an async operation.
    //
    private removeAsyncOperation(asyncId: number, reason: string): void {
        const asyncOp = this.curAsyncOps.get(asyncId)
        if (!asyncOp) {
            // Not tracked.
            return;
        }

        asyncOp.status = "completed";

        // Debugging.
        // const error: any = {};
        // Error.captureStackTrace(error);
        // Error.stackTraceLimit = Infinity;

        // const stack: string[] = (error.stack as string).split("\n").map(line => line.trim());
        // asyncOp.resolvedStack = stack;

        this.curAsyncOps.delete(asyncId);

        const cellIndex = this.findCellIndex(asyncId);
        if (cellIndex !== undefined) {
            const numAsyncOps = this.numCellOps.get(cellIndex);
            if (numAsyncOps !== undefined) {
                this.numCellOps.set(cellIndex, numAsyncOps-1);
                // fs.writeSync(1, `%% remove ${asyncId}, reason = ${reason}, cell = ${cellIndex}, #cellops = ${this.numCellOps.get(cellIndex)}, #ops = ${this.getNumAsyncOps()}.\n`);
            }
            else {
                fs.writeSync(1, `ASYNC ERROR: No async ops in cell ${cellIndex}`);
            }
        }
        else {
            fs.writeSync(1, `ASYNC ERROR: Async op ${asyncId} doesn't match a cell!`);
        }
    }

    //
    // The number of in-flight async operations.
    //
    getNumAsyncOps(): number {
        return this.curAsyncOps.size;
    }

    //
    // Is the requested async operating contained in this context.
    //
    inContext(asyncId: number): boolean {
        return this.allAsyncOps.has(asyncId);
    }

    toObject(op: IAsyncOp, includeChildren: boolean): any {
        return {
            asyncId: op.asyncId,
            type: op.type,
            triggerAsyncId: op.triggerAsyncId,
            status: op.status,
            cellIndex: op.cellIndex,
            // Debugging.
            // createdStack: op.createdStack,
            // resolvedStack: op.resolvedStack,
            children: includeChildren 
                ? Array.from(op.children.values())
                    .filter(child => this.showAsyncOp(child))
                    .map(child => this.toObject(child, includeChildren))
                : [],
        };
    }

    showAsyncOp(op: IAsyncOp): boolean {
        return true; 
        // if (op.status !== "completed") {
        //     return true;
        // }

        // if (op.children.size > 0) {
        //     for (const child of op.children.values()) {
        //         if (this.showAsyncOp(child)) {
        //             return true;
        //         }
        //     }
        // }

        // return false;
    }

    //
    // Dump a debug representation.
    //
    dump(): string {

        const numCellOps: any = {};
        for (const cellEntry of this.numCellOps) {
            numCellOps[cellEntry[0]] = cellEntry[1];        
        }

        // return JSON.stringify({ 
        //     id: this.id, 
        //     isTracking: this.isTracking(),
        //     parentId: this.parentId, 
        //     cellId: this.cellId, 
        //     historical: Array.from(this.allAsyncOps.keys()) 
        // }, null, 4);

        return JSON.stringify({
            remainingOps: this.getNumAsyncOps(),
            isTracking: this.isTracking(),
            numCellOps,
            curOps: Array.from(this.curAsyncOps.values()).map(op => this.toObject(op, false)),
            ops: Array.from(this.rootOps.values())
                .filter(op => this.showAsyncOp(op))
                .map(op => this.toObject(op, true)),
        }, null, 4);
    }
}