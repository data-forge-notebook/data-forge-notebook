import { IEditorCaretPosition } from "./editor-caret-position";
import { IEventSource, BasicEventHandler, EventSource } from "utils";
import { CellType, ISerializedCell1 } from "model";
import { action, makeObservable, observable } from "mobx";

export type FocusedEventHandler = (sender: ICellViewModel) => Promise<void>;
export type SetCaretPositionEventHandler = (sender: ICellViewModel, caretPosition: IEditorCaretPosition) => Promise<void>;
export type FindNextMatchEventHandler = (startingPosition: IEditorCaretPosition, searchDirection: SearchDirection, doSelection: boolean, findDetails: IFindDetails) => Promise<void>;
export type SelectTextEventHandler = (range: ITextRange) => Promise<void>;
export type ReplaceTextEventHandler = (range: ITextRange, replaceText: string) => Promise<void>;
export type EditorSelectionChangingEventHandler = (sender: ICellViewModel, willBeSelected: boolean) => Promise<void>;
export type EditorSelectionChangedEventHandler = (sender: ICellViewModel) => Promise<void>;
export type TextChangedEventHandler = (sender: ICellViewModel) => Promise<void>;

//
// Specifies whether a text search goes forward or backward.
//
export enum SearchDirection {
    Forward,
    Backward,
}

//
// Range of text in the editor.
// Copyied from range.ts in vs code.
//
export interface ITextRange {

	/**
	 * Line number on which the range starts (starts at 1).
	 */
	readonly startLineNumber: number;

	/**
	 * Column on which the range starts in line `startLineNumber` (starts at 1).
	 */
	readonly startColumn: number;

	/**
	 * Line number on which the range ends.
	 */
	readonly endLineNumber: number;

	/**
	 * Column on which the range ends in line `endLineNumber`.
	 */
	readonly endColumn: number;
}

//
// Extra details to control find and replace.
//
export interface IFindDetails {
    //
    // Text to search for.
    //
    text: string;

    //
    // Set to true to match case.
    //
    matchCase: boolean;

    //
    // Set to true to match the whole word.
    //
    matchWholeWord: boolean;

    //
    // Event raised when a match is found.
    //
    notifyMatchFound(matchRange: ITextRange, searchDirection: SearchDirection, doSelection: boolean): Promise<void>;

    //
    // Event raised when a match is not found.
    //
    notifyMatchNotFound(searchDirection: SearchDirection, doSelection: boolean): Promise<void>;
}

export type ScrollIntoViewEventHandler = (scrollReason: string) => Promise<void>;
export type CellModifiedEventHandler = (cell: ICellViewModel) => Promise<void>;

//
// View-model for a cell.
//
export interface ICellViewModel {   

    //
    // Unique id for the cell.
    //
    readonly id: string;

    //
    // The type of the cell.
    //
    readonly cellType: CellType;

    //
    // The text for the cell.
    //
    text: string;

    //
    // Set to true if this cell is currently selected.
    //
    selected: boolean;    
    
    //
    // Records the text that is selected in the editor.
    //
    selectedText: string;

    // 
    // Range of the currently selected text.
    //
    selectedTextRange: ITextRange | undefined;

    //
    // The latest caret postition.
    //
    caretOffset?: number;    

    //
    // Set the text in the editor.
    // Marks the code as dirty if changed.
    //
    setText(code: string): Promise<boolean>;

    //
    // Event raised when the text in this editor has changed.
    //
    onTextChanged: IEventSource<TextChangedEventHandler>;

    //
    // Scroll the notebook so this cell is visible.
    //
    scrollIntoView(scrollReason: string): Promise<void>;

    //
    // Event raised to make the cell scroll into view.
    //
    onScrollIntoView: IEventSource<ScrollIntoViewEventHandler>;
    
    //
    // Clear all the outputs from the cell.
    //
    clearOutputs(): Promise<void>;

    //
    // Clear all the errors from the cell.
    //
    clearErrors(): Promise<void>;
    
    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedCell1;

    //
    // Serialize the CELL for evaluation. This excludes elements of the data that aren't needed for evaluation.
    //
    serializeForEval(): ISerializedCell1;

    //
    // Event raised when model has been modified.
    //
    onModified: IEventSource<CellModifiedEventHandler>;

    //
    // Event raised when output has been added to the cell.
    //
    onOutputChanged: IEventSource<BasicEventHandler>;

    //
    // Event raised when the cell's errors have changed.
    //
    onErrorsChanged: IEventSource<BasicEventHandler>;

    //
    // The notebook has started executing.
    //
    notifyNotebookEvalStarted(): void;

    //
    // Start asynchonrous evaluation of the cell's code.
    //
    notifyCodeEvalStarted(): Promise<void>;

    //
    // Notify the cell that code evaluation has compled.
    //
    notifyCodeEvalComplete(): Promise<void>;

    //
    // Select this editor.
    //
    select(): Promise<void>; 

    //
    // Deselect this editor.
    //
    deselect(): Promise<void>; 

    //
    // Event raised when the selected editor is about to change.
    //
    onEditorSelectionChanging: IEventSource<EditorSelectionChangingEventHandler>;  //todo: ???

    //
    // Event raised when the selected editor has changed.
    //
    onEditorSelectionChanged: IEventSource<EditorSelectionChangedEventHandler>;   //todo: ???

    //
    // Focus the editor.
    //
    focus(): Promise<void>;

    //
    // Event raised to make the editor focused.
    //
    onSetFocus: IEventSource<FocusedEventHandler>;

    //
    // Get the caret position within the editor.
    //
    getCaretPosition(): IEditorCaretPosition | null;

    //
    // Allows the editor to link and provide the position of the caret in the editor.
    //
    caretPositionProvider?: () => IEditorCaretPosition | null;

    //
    // Set the position of the caret in the editor.
    //
    setCaretPosition(caretPosition: IEditorCaretPosition): Promise<void>;

    //
    // Event raised when the caret position has been set for the editor.
    //
    onSetCaretPosition: IEventSource<SetCaretPositionEventHandler>;

    //
    // Select a range of text in the editor.
    //
    selectText(range: ITextRange): Promise<void>;

    //
    // Event raised when text should be selected.
    //
    onSelectText: IEventSource<SelectTextEventHandler>; 

    //
    // Deselect text in the editor.
    //
    deselectText(): Promise<void>;

    //
    // Event raised when text should be deselected.
    //
    onDeselectText: IEventSource<BasicEventHandler>; 

    //
    // Replace requested range with spedcified text..
    //
    replaceText(range: ITextRange, replaceText: string): Promise<void>;

    //
    // Event raised when text should be replaced.
    //
    onReplaceText: IEventSource<ReplaceTextEventHandler>; 

    //
    // Find the next instance of text.
    //
    findNextMatch(startingPosition: IEditorCaretPosition, searchDirection: SearchDirection, doSelection: boolean, findDetails: IFindDetails): Promise<void>;

    //
    // Event raised when a request is made to find the next match.
    //
    onFindNextMatch: IEventSource<FindNextMatchEventHandler>;

    //
    // Notify the model it is about to be saved.
    //
    flushChanges(): Promise<void>;

    //
    // Event raised before the model is saved.
    //
    onFlushChanges: IEventSource<BasicEventHandler>;
}

export abstract class CellViewModel implements ICellViewModel {

    //
    // Unique id for the cell.
    //
    readonly id: string;

    //
    // The type of the cell.
    //
    readonly cellType: CellType;

    //
    // The text for the cell.
    //
    text: string;

    //
    // Set to true if this cell is currently selected.
    //
    selected: boolean = false;    
    
    //
    // Records the text that is selected in the editor.
    //
    selectedText: string = "";

    // 
    // Range of the currently selected text.
    //
    selectedTextRange: ITextRange | undefined;

    //
    // The latest caret postition.
    //
    caretOffset?: number;

    constructor(id: string, cellType: CellType, text: string) {
        this.id = id;
        this.cellType = cellType;
        this.text = text;

        makeObservable(this, {
            text: observable,
            selected: observable,
            setText: action,
            select: action,
            deselect: action,           
        });
    }

    //
    // Set the txt for the cell.
    // Returns true if the text was changed.
    //
    _setText(text: string): boolean {
        const trimmed = text.trimRight();
        if (this.text === trimmed) {
            return false; // No change.
        }

        this.text = trimmed;
        return true;
    }

    //
    // Set the text for the cell.
    // Marks the text as dirty if changed.
    //
    async setText(text: string): Promise<boolean> {

        if (this._setText(text)) {
            await this.notifyModified();
            await this.onTextChanged.raise(this);
            return true;
        }

        return false;
    }

    //
    // Event raised when the code in this cell has changed.
    //
    onTextChanged: IEventSource<TextChangedEventHandler> = new EventSource<TextChangedEventHandler>();
    
    //
    // Serialize to a data structure suitable for serialization.
    //
    serialize(): ISerializedCell1 {
        return {
            id: this.id,
            cellType: this.cellType,
            code: this.text,
        };
    }

    //
    // Serialize the CELL for evaluation. This excludes elements of the data that aren't needed for evaluation.
    //
    serializeForEval(): ISerializedCell1 {
        return {
            id: this.id,
            cellType: this.cellType,
            code: this.text,
        };
    }

    //
    // Scroll the notebook so this cell is visible.
    //
    async scrollIntoView(scrollReason: string): Promise<void> {
        await this.onScrollIntoView.raise(scrollReason);
    }

    //
    // Event raised to make the cell scroll into view.
    //
    onScrollIntoView: IEventSource<ScrollIntoViewEventHandler> = new EventSource<ScrollIntoViewEventHandler>();

    //
    // Focus the cell.
    //
    async focus(): Promise<void> {
        await this.onSetFocus.raise(this);
    }
    
    //
    // Event raised to make the editor focused.
    //
    onSetFocus: IEventSource<FocusedEventHandler> = new EventSource<FocusedEventHandler>();
    
    //
    // Get the caret position within the cell.
    //
    getCaretPosition(): IEditorCaretPosition | null {
        if (!this.caretPositionProvider) {
            // Null is used here to mimic the return value from Monaco editor.
            // Normally I'd use undefined for this sort of thing.
            return null; 
        }

        return this.caretPositionProvider();
    }

    //
    // Allows the editor to link and provide the position of the caret in the cell.
    //
    caretPositionProvider?: () => IEditorCaretPosition | null;
    
    //
    // Set the position of the caret in the cell.
    //
    async setCaretPosition(caretPosition: IEditorCaretPosition): Promise<void> {
        await this.onSetCaretPosition.raise(this, caretPosition);
    }

    //
    // Event raised when the caret position has been set for th cell.
    //
    onSetCaretPosition: IEventSource<SetCaretPositionEventHandler> = new EventSource<SetCaretPositionEventHandler>();

    //
    // Clear all the outputs from the cell.
    //
    abstract clearOutputs(): Promise<void>;

    //
    // Clear all the errors from the cell.
    //
    abstract clearErrors(): Promise<void>;
    
    //
    // Select this cell.
    //
    async select(): Promise<void> {
        
        if (this.selected) {
            // Already selected.
            return;
        }

        await this.onEditorSelectionChanging.raise(this, true);

        this.selected = true;

        await this.onEditorSelectionChanged.raise(this);

        // Focus the seleted cell.
        await this.focus();
    }

    //
    // Deselect this cell.
    //
    async deselect(): Promise<void> {
        if (!this.selected) {
            // Already deselected.
            return;
        }

        await this.onEditorSelectionChanging.raise(this, false);

        this.selected = false;

        await this.onEditorSelectionChanged.raise(this);
    }

    //
    // Event raised when the selection is about to change.
    //
    onEditorSelectionChanging: IEventSource<EditorSelectionChangingEventHandler> = new EventSource<EditorSelectionChangingEventHandler>();

    //
    // Event raised when the selection for this cell has changed.
    //
    onEditorSelectionChanged: IEventSource<EditorSelectionChangedEventHandler> = new EventSource<EditorSelectionChangedEventHandler>();

    //
    // Select a range of text in the cell.
    //
    async selectText(range: ITextRange): Promise<void> {
        await this.onSelectText.raise(range);
    }

    //
    // Event raised when text should be selected.
    //
    onSelectText: IEventSource<SelectTextEventHandler> = new EventSource<SelectTextEventHandler>();

    //
    // Deselect text in the cell.
    //
    async deselectText(): Promise<void> {
        await this.onDeselectText.raise();
    }

    //
    // Event raised when text should be deselected.
    //
    onDeselectText: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Replace requested range with spedcified text..
    //
    async replaceText(range: ITextRange, replaceText: string): Promise<void> {
        await this.onReplaceText.raise(range, replaceText);
    }

    onReplaceText: IEventSource<ReplaceTextEventHandler> = new EventSource<ReplaceTextEventHandler>();

    //
    // Notify the model it is about to be saved.
    //
    async flushChanges(): Promise<void> {
        await this.onFlushChanges.raise();
    }

    //
    // Event raised before the model is saved.
    //
    onFlushChanges: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Notify listeners that the cells has been modified.
    //
    async notifyModified(): Promise<void> {
        await this.onModified.raise(this);  
    }

    //
    // Event raised when model has been modified.
    //
    onModified: IEventSource<CellModifiedEventHandler> = new EventSource<CellModifiedEventHandler>();

    //
    // Find the next instance of text.
    //
    async findNextMatch(startingPosition: IEditorCaretPosition, searchDirection: SearchDirection, doSelection: boolean, findDetails: IFindDetails): Promise<void> {
        await this.onFindNextMatch.raise(startingPosition, searchDirection, doSelection, findDetails);
    }

    //
    // Event raised when a request is made to find the next match.
    //
    onFindNextMatch: IEventSource<FindNextMatchEventHandler> = new EventSource<FindNextMatchEventHandler>();

    //
    // Event raised when the cell's output has changed.
    //
    onOutputChanged: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Event raised when the cell's errors have changed.
    //
    onErrorsChanged: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // The notebook has started executing.
    //
    abstract notifyNotebookEvalStarted(): void;

    //
    // Start asynchonrous evaluation of the cell's code.
    //
    abstract notifyCodeEvalStarted(): Promise<void>;

    //
    // Notify the cell that code evaluation has compled.
    //
    abstract notifyCodeEvalComplete(): Promise<void>;
}
