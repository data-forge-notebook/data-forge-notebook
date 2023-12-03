
//
// Specifies initialization values for an action context.
//

import { ICellViewModel } from "../view-model/cell";
import { ICellOutputViewModel } from "../view-model/cell-output";
import { INotebookViewModel } from "../view-model/notebook";
import { INotebookEditorViewModel } from "../view-model/notebook-editor";
import { IChange } from "./undoredo";

//
// The context in which an action is invoked.
//
export interface IActionContextInitializer {
    //
    // The notebook, if an, the action is invoked against.
    //
    notebook?: INotebookViewModel;

    //
    // The cell, if any, an action is invoked against.
    //
    cell?: ICellViewModel;

    //
    // The output, if any, an action is invoked against.
    //
    cellOutput?: ICellOutputViewModel;
}

//
// The context in which an action is evaluated.
// Only one of notebook or cell needs to be set.
//
export interface IActionContext {

    //
    // Gets the notebook editor.
    //
    getNotebookEditor(): INotebookEditorViewModel;

    //
    // Is there a notebook open?
    //
    hasNotebook(): boolean;

    //
    // Get the notebook that the action affects.
    //
    getNotebook(): INotebookViewModel;

    //
    // Is there cell available?
    //
    hasCell(): boolean;

    //
    // Get the cell that the action affects.
    //
    getCell(): ICellViewModel;

    //
    // Get the currently selected cell, or undefined if none is selected.
    //
    getSelectedCell(): ICellViewModel | undefined;

    //
    // Get the cell output that the action affects.
    //
    getCellOutput(): ICellOutputViewModel | undefined;

    //
    // Get optional parameters provide for the action.
    //
    getParams(): any;
}

export class ActionContext implements IActionContext {

	//
	// The notebook editor to run commands against.
	//
	private notebookEditor: INotebookEditorViewModel;

    //
    // Initial parameters for the action context.
    //
    private initializer: IActionContextInitializer;

    //
    // Optional parameters to the action.
    //
    private params: any;

    constructor(notebookEditor: INotebookEditorViewModel, initializer: IActionContextInitializer, params?: any) {
        this.notebookEditor = notebookEditor;
        this.initializer = initializer;
        this.params = params || {};
    }

    //
    // Gets the notebook editor.
    //
    getNotebookEditor(): INotebookEditorViewModel {
        return this.notebookEditor;
    }

    //
    // Is there a notebook open?
    //
    hasNotebook(): boolean {
        if (this.initializer.notebook) {
            return true;
        }

        return this.notebookEditor.notebook !== undefined;
    }

    //
    // Get the notebook that the action affects.
    //
    getNotebook(): INotebookViewModel {
        if (this.initializer.notebook) {
            return this.initializer.notebook;
        }

        return this.notebookEditor.notebook!;
    }

    //
    // Is there cell available?
    //
    hasCell(): boolean {
        if (this.initializer.cell) {
            return true;
        }

        return this.hasNotebook() && !!this.getSelectedCell();
    }

    //
    // Get the cell that the action affects.
    //
    getCell(): ICellViewModel {
        const selectedCell = this.getSelectedCell();
        if (selectedCell) {
            return selectedCell;
        }

        throw new Error("Context doesn't relate to any cell.");
    }

    //
    // Get the currently selected cell, or undefined if none is selected.
    //
    getSelectedCell(): ICellViewModel | undefined {
        if (this.initializer.cell) {
            return this.initializer.cell;
        }

        const notebook = this.getNotebook();
        const selectedCell = notebook.selectedCell;
        if (selectedCell) {
            return selectedCell;
        }

        return undefined;
    }

    //
    // Get the cell output that the action affects.
    //
    getCellOutput(): ICellOutputViewModel | undefined {
        return this.initializer.cellOutput;
    }

    //
    // Get optional parameters provide for the action.
    //
    getParams(): any {
        return this.params;
    }
}

//
// Interface for actions the user can take in the application.
//
export interface IAction {
    invoke(context: IActionContext): Promise<IChange[] | IChange | void>;
}
