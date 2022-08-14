import { ILog } from "utils";
import { InjectableSingleton, InjectProperty } from "@codecapers/fusion";
import { INotebookViewModel } from "../view-model/notebook";
import { INotebookCaretPosition } from "../view-model/notebook-caret-position";

//
// Identifies the undo-redo service.
//
export const IUndoRedoId = "IUndoRedo";

//
// Defines a change that has occurred.
//
export interface IChange {

    //
    // Do a change.
    //
    do(): Promise<void>;

    //
    // Redo a change.
    //
    redo(): Promise<void>;

    //
    // Undo a change that was made.
    //
    undo(): Promise<void>;

    //
    // Dump the state of the change.
    //
    dumpState(): string;
}

//
// Records a change in the undo/redo stack.
//
interface IChangeRecord {

    //
    // The changes that were applied.
    //
    changes: IChange[];

    //
    // Set to true if the notebook is modified before the change was applied.
    //
    isModifiedBefore: boolean;

    //
    // Set to true if the notebook is modified after the change was applied.
    //
    isModifiedAfter: boolean;

    //
    // Position of the caret before the change was applied.
    //
    caretPositionBefore?: INotebookCaretPosition;

    //
    // Position of the caret after the change was applied.
    //
    caretPositionAfter?: INotebookCaretPosition;
}

//
// Interface for undo/redo.
//
export interface IUndoRedo {

    //
    // Clear the undo/redo stack to an initial state.
    //
    clearStack(notebook: INotebookViewModel): void;

    //
    // Apply an undoable change.
    //
    applyChanges(changes: IChange[]): Promise<void>; 

    //
    // Get the number levels in the undo/redo stack.
    //
    getNumLevels(): number;

    //
    // Returns true if at the first level in the undo/redo stack.
    //
    atStart(): boolean;

    //
    // Returns true if at the last level in the undo/redo stack.
    //
    atEnd(): boolean;

    //
    // Move to the previous notebook state.
    //
    movePrevious(): Promise<void>;

    //
    // Move to the next notebook state.
    //
    moveNext(): Promise<void>;

}

//
// Service for undo/redo.
//
@InjectableSingleton(IUndoRedoId)
export class UndoRedo implements IUndoRedo {

    @InjectProperty("ILog")
    log!: ILog;

    //
    // Maximum size of the stack.
    //
    MAX_UNDO_REDO_STACK_SIZE = 100;

    //
    // Stack of snapshot.
    //
    private undoRedoStack: IChangeRecord[] = [];

    //
    // Index of the next position.
    //
    private curPos: number = 0;

    //
    // The current notebook that is loaded.
    //
    private notebook?: INotebookViewModel;

    //
    // Clear the undo/redo stack.
    //
    clearStack(notebook: INotebookViewModel): void {
        this.undoRedoStack = [];
        this.curPos = 0;
        this.notebook = notebook;
    }

    //
    // Apply an undoable change.
    //
    async applyChanges(changes: IChange[]): Promise<void> {
      
        const notebook = this.notebook!;
        const beforeModified = notebook.isModified();
        const beforeCaretPosition = notebook.getCaretPosition();

        // console.log("!! Appying undoable change.");
        //this.log.info(`Notebook modified state before is ${beforeModified}`);
        //this.log.info(`Caret position before is ${format(beforeCaretPosition)}.`);
        // console.log("!! Before");
        // this.dumpState();

        // Apply the change.
        for (const change of changes) {
            await change.do();
        }

        const afterModified = notebook.isModified();
        const afterCaretPosition = notebook.getCaretPosition();
        //this.log.info(`Notebook modified state after is ${afterModified}`);
        //this.log.info(`Caret position after is ${format(afterCaretPosition)}.`);

        // Clear future positions in the undo redo stack.
        this.undoRedoStack = this.undoRedoStack.slice(0, this.curPos); 

        const changeRecord: IChangeRecord = {
            changes: changes,
            isModifiedBefore: beforeModified,
            isModifiedAfter: afterModified,
            caretPositionBefore: beforeCaretPosition,
            caretPositionAfter: afterCaretPosition,
        };

        // Add new change to undo/redo stack.
        this.undoRedoStack = this.undoRedoStack.concat([changeRecord]);
        ++this.curPos;

        const numToRemove = this.undoRedoStack.length - this.MAX_UNDO_REDO_STACK_SIZE;
        if (numToRemove > 0) {
            this.undoRedoStack = this.undoRedoStack.slice(numToRemove);
            this.curPos -= numToRemove;
        }

        // console.log("!! After");
        // this.dumpState();
    }

    //
    // Get the number level in the undo/redo stack.
    //
    getNumLevels(): number {
        return this.undoRedoStack.length;
    }

    //
    // Returns true if at the first snapshot in the undo/redo stack.
    //
    atStart(): boolean {
        return this.curPos <= 0;
    }

    //
    // Returns true if at the last snapshot in the undo/redo stack.
    //
    atEnd(): boolean {
        return this.curPos >= this.getNumLevels();
    }

    //
    // Move to the previous notebook state.
    //
    async movePrevious(): Promise<void> {
        if (this.atStart()) {
            throw new Error(`Can't move previous, already at the start of the undo-redo stack.`);
        }

        const notebook = this.notebook!;
        await notebook.flushChanges();

        // console.log("!! Undoing change.");
        // console.log("!! Before");
        // this.dumpState();

        --this.curPos;
        const changeRecord = this.undoRedoStack[this.curPos];
        
        for (let changeIndex = changeRecord.changes.length-1; changeIndex >= 0; --changeIndex) { // Work backward through changes.
            const change = changeRecord.changes[changeIndex];
            await change.undo();
        }

        await notebook.setModified(changeRecord.isModifiedBefore);

        //this.log.info(`Set notebook modifified state to ${changeRecord.isModifiedBefore}.`);

        if (changeRecord.caretPositionBefore) {
            //this.log.info(`Set caret position to ${format(changeRecord.caretPositionBefore)}.`);
            const cell = notebook.getCellByIndex(changeRecord.caretPositionBefore.cellIndex);
            if (!cell) {
                throw new Error(`Cell with index ${changeRecord.caretPositionBefore.cellIndex} doesn't exist!`);
            }
            await cell.select();
            await cell.setCaretPosition(changeRecord.caretPositionBefore.cellPosition);
        }

        // console.log("!! After");
        // this.dumpState();        
    }

    //
    // Move to the next notebook state.
    //
    async moveNext(): Promise<void> {
        if (this.atEnd()) {
            throw new Error(`Can't move next, already at the end of the undo-redo stack.`);
        }

        const notebook = this.notebook!;
        await notebook.flushChanges();

        // this.log.info("!! Redoing change.");
        // console.log("!! Before");
        // this.dumpState();

        const changeRecord = this.undoRedoStack[this.curPos];
        for (const change of changeRecord.changes) {
            await change.redo();
        }
        ++this.curPos;

        await notebook.setModified(changeRecord.isModifiedAfter);

        //this.log.info(`Set notebook modifified state to ${changeRecord.isModifiedAfter}.`);

        if (changeRecord.caretPositionAfter) {
            //this.log.info(`Set caret position to ${format(changeRecord.caretPositionAfter)}.`);
            const cell = notebook.getCellByIndex(changeRecord.caretPositionAfter.cellIndex);
            if (!cell) {
                throw new Error(`Cell with index ${changeRecord.caretPositionAfter.cellIndex} doesn't exist!`);
            }
            await cell.select();
            await cell.setCaretPosition(changeRecord.caretPositionAfter.cellPosition);
        }

        // console.log("!! After:");
        // this.dumpState();
    }

    //
    // Debug function to dump state of undo stack.
    //
    // dumpState(): void {
    //     console.log(`    cur pos: ${this.curPos}`);
    //     if (this.undoRedoStack.length === 0) {
    //         console.log("    empty");
    //         return;
    //     }

    //     let changeIndex = 0;
    //     for (const changeRecord of this.undoRedoStack) {
    //         let line: string = "    ";
    //         if (changeIndex === this.curPos) {
    //             line += ">> "
    //         }

    //         line += `[${changeIndex}] ${changeRecord.changes.constructor.name} > ${changeRecord.changes.dumpState()}`;
    //         console.log(line);
    //         ++changeIndex;
    //     }

    //     if (this.curPos === this.undoRedoStack.length) {
    //         console.log("    >> [end]");
    //     }
    //     else {
    //         console.log("    [end]");
    //     }
    // }
}
