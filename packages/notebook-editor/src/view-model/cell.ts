import { IMonacoEditorViewModel, ITextRange, FocusedEventHandler, SetCaretPositionEventHandler, SelectTextEventHandler, ReplaceTextEventHandler, SearchDirection, FindNextMatchEventHandler, EditorSelectionChangedEventHandler, IFindDetails, EditorSelectionChangingEventHandler, TextChangedEventHandler } from "./monaco-editor";
import { IEditorCaretPosition } from "./editor-caret-position";
import { IEventSource, BasicEventHandler, EventSource } from "utils";
import { CellType, ISerializedCell1 } from "model";

export type ScrollIntoViewEventHandler = (scrollReason: string) => Promise<void>;
export type CellModifiedEventHandler = (cell: ICellViewModel) => Promise<void>;

//
// View-model for a cell.
//
export interface ICellViewModel extends IMonacoEditorViewModel {   

    //
    // Get the unique id for the cell.
    //
    getId(): string;

    //
    // Get the type of the cell.
    //
    getCellType(): CellType;

    //
    // Gets the height of the cell (if recorded).
    //
    getHeight(): number | undefined;
    
    //
    // Sets the height of the cell (once known).
    //
    setHeight(height: number): void;

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
    // Event raised when the cell has started evaluation.
    //
    onEvalStarted: IEventSource<BasicEventHandler>;
    
    //
    // Event raised when the cell has completed evaluation.
    //
    onEvalCompleted: IEventSource<BasicEventHandler>;

}

export class CellViewModel implements ICellViewModel {

    //
    // Unique id for the cell.
    //
    private id: string;

    //
    // The type of the cell.
    //
    private cellType: CellType;

    //
    // The text for the cell.
    //
    private text: string;

    //
    // The height of the cell (if recorded).
    //
    height: number | undefined;    
       
    //
    // Set to true if this cell is currently selected.
    //
    private selected: boolean = false;    
    
    //
    // Records the text that is selected in the editor.
    //
    private selectedText: string = "";

    // 
    // Range of the currently selected text.
    //
    private selectedTextRange: ITextRange | undefined;

    //
    // The latest caret offset in the cell.
    //
    private caretOffset?: number;

    constructor(id: string, cellType: CellType, text: string, height: number | undefined) {
        this.id = id;
        this.cellType = cellType;
        this.text = text;
        this.height = height;
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
    // Get the text for the cell.
    //
    getText(): string {
        return this.text;
    }

    //
    // Set the txt for the cell.
    // Returns true if the text was changed.
    //
    private _setText(text: string): boolean {
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
            code: this.text,
            height: this.height,
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
    // Get the latest caret offset in the cell.
    //
    getCaretOffset(): number | undefined {
        return this.caretOffset;
    }

    //
    // Sets the carent offset.
    //
    setCaretOffset(caretOffset: number): void {
        this.caretOffset = caretOffset;
    }

    //
    // Clear all the outputs from the cell.
    //
    async clearOutputs(): Promise<void> {
        // Nothing to do for generic cell.
    }

    //
    // Clear all the errors from the cell.
    //
    async clearErrors(): Promise<void> {
        // Nothing to do for generic cell.
    }
    
    //
    // Returns true if this cell is currently selected.
    //
    isSelected(): boolean {
        return this.selected;
    }

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
    // Records the text that is selected in the editor.
    //
    setSelectedText(selectedText: string): void {
        this.selectedText = selectedText;
    }

    //
    // Gets the text that is selected in the editor.
    //
    getSelectedText(): string {
        return this.selectedText;
    }

    //
    // Gets the range of the currently selected text.
    //
    setSelectedTextRange(range: ITextRange | undefined): void {
        this.selectedTextRange = range;
    }

    //
    // Gets the range of the currently selected text.
    //
    getSelectedTextRange(): ITextRange | undefined {
        return this.selectedTextRange;
    }

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
    notifyNotebookEvalStarted(): void {
        // Only implemented for code cells.
    }

    //
    // Start asynchonrous evaluation of the cell's code.
    //
    async notifyCodeEvalStarted(): Promise<void> {
        // Only implemented for code cells.
    }

    //
    // Notify the cell that code evaluation has compled.
    //
    async notifyCodeEvalComplete(): Promise<void> {
        // Only implemented for code cells.
    }

    //
    // Event raised when the cell has started evaluation.
    //
    onEvalStarted: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();
    
    //
    // Event raised when the cell has completed evaluation.
    //
    onEvalCompleted: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();
}
