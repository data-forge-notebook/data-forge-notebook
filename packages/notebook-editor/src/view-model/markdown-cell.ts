import { IEventSource, BasicEventHandler, EventSource } from "utils";
import { CellType, ISerializedCell1 } from "model";
import { ICellViewModel, CellViewModel } from "./cell";

//
// Represents a cell within a notebook.
//
export interface IMarkdownCellViewModel extends ICellViewModel {

    //
    // Returns true when the markdown cell is in editing mode.
    //
    isEditing(): boolean;

    //
    // Switch the markdown cell to edit mode.
    //
    enterEditMode(): Promise<void>;

    //
    // Switch the markdown cell to preview mode.
    //
    enterPreviewMode(): Promise<void>;

    //
    // Event raised with the markdown cell switches from preview to editing mode and vice-versa.
    //
    onModeChanged: IEventSource<BasicEventHandler>;
}

export class MarkdownCellViewModel extends CellViewModel implements IMarkdownCellViewModel {

    //
    // Set to true when the markdown cell is in editing mode.
    //
    private editing: boolean;

    constructor(id: string, cellType: CellType, text: string, height: number | undefined) {
        super(id, cellType, text, height);

        this.editing = false;
    }

    //
    // Returns true when the markdown cell is in editing mode.
    //
    isEditing(): boolean {
        return this.editing;
    }

    //
    // Switch the markdown cell to edit mode.
    //
    async enterEditMode(): Promise<void> {
        if (this.editing) {
            return; // Already in edit mode.
        }

        this.editing = true;
        await this.onModeChanged.raise();

        // Automatically select and focus cells when editing has started.
        await this.focus(); // Entering edit mode should focus even when the cell is already selected.
        await this.select(); // If cell is already selected, this has no effect.
    }

    //
    // Switch the markdown cell to preview mode.
    //
    async enterPreviewMode(): Promise<void> {
        if (!this.editing) {
            return; // Already in preview mode.
        }

        // Flush code changes when changing from edit to preview mode.
        await this.flushChanges();

        this.editing = false;
        await this.onModeChanged.raise();
    }
    
    //
    // Event raised with the markdown cell switches from preview to editing mode and vice-versa.
    //
    onModeChanged: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

   //
    // Deserialize the model from a previously serialized data structure.
    //
    static deserialize(input: ISerializedCell1): IMarkdownCellViewModel {
        return new MarkdownCellViewModel(
            input.id,
            input.cellType || CellType.Code,
            input.code || "",
            input.height
        );
    }           
}