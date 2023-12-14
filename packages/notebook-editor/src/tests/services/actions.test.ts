import { ActionContext } from "../../services/action";

describe("action", () => {

    test("can get notebook editor", () => {

        const mockNotebookEditor: any = { id: "notebook-editor" };
        const mockContextInitializer: any = {};

        const actionContext = new ActionContext(mockNotebookEditor, mockContextInitializer);
        expect(actionContext.getNotebookEditor()).toBe(mockNotebookEditor);
    });

    test("`can test for no`tebook in context", () => {

        const mockNotebookEditor: any = {};
        const mockNotebook: any = {};
        const mockContextInitializer: any = {
            notebook: mockNotebook,
        };
        
        const actionContext = new ActionContext(mockNotebookEditor, mockContextInitializer);
        expect(actionContext.hasNotebook()).toBe(true);
    });

    test("can test for notebook in editor", () => {

        const mockNotebookEditor: any = {
            notebook: {},
        };
        const mockContextInitializer: any = {};
        
        const actionContext = new ActionContext(mockNotebookEditor, mockContextInitializer);
        expect(actionContext.hasNotebook()).toBe(true);
    });

    test("can get notebook from context", () => {

        const mockNotebookEditor: any = {};
        const mockNotebook: any = { id: "notebook" };
        const mockContextInitializer: any = {
            notebook: mockNotebook,
        };
        
        const actionContext = new ActionContext(mockNotebookEditor, mockContextInitializer);
        expect(actionContext.getNotebook()).toBe(mockNotebook);
    });

    test("can get notebook from editor", () => {

        const mockNotebook: any = { id: "notebook" };
        const mockNotebookEditor: any = {
            notebook: mockNotebook,
        };
        const mockContextInitializer: any = {};

        const actionContext = new ActionContext(mockNotebookEditor, mockContextInitializer);
        expect(actionContext.getNotebook()).toBe(mockNotebook);
    });

    test("can get cell output from context", () => {

        const mockNotebookEditor: any = {};
        const mockCellOutput: any = { id: "cell-output" };
        const mockContextInitializer: any = {
            cellOutput: mockCellOutput,
        };

        const actionContext = new ActionContext(mockNotebookEditor, mockContextInitializer);
        expect(actionContext.getCellOutput()).toBe(mockCellOutput);
    });

    test("can get cell from context", () => {

        const mockNotebookEditor: any = {};
        const mockCell: any = { id: "cell" };
        const mockContextInitializer: any = {
            cell: mockCell,
        };

        const actionContext = new ActionContext(mockNotebookEditor, mockContextInitializer);
        expect(actionContext.getCell()).toBe(mockCell);
    });

    test("can get cell from notebook", () => {

        const mockCell: any = { id: "cell" };
        const mockNotebookEditor: any = {
            notebook: {
                selectedCell: mockCell,
            },
        };
        const mockContextInitializer: any = {};

        const actionContext = new ActionContext(mockNotebookEditor, mockContextInitializer);
        expect(actionContext.getCell()).toBe(mockCell);
    });

    test("can test for cell from context", () => {

        const mockNotebookEditor: any = {};
        const mockCell: any = { id: "cell" };
        const mockContextInitializer: any = {
            cell: mockCell,
        };

        const actionContext = new ActionContext(mockNotebookEditor, mockContextInitializer);
        expect(actionContext.hasCell()).toBe(true);
    });

    test("can test for cell from notebook", () => {

        const mockCell: any = { id: "cell" };
        const mockNotebookEditor: any = {
            notebook: {
                selectedCell: mockCell,
            },
        };
        const mockContextInitializer: any = {};

        const actionContext = new ActionContext(mockNotebookEditor, mockContextInitializer);
        expect(actionContext.hasCell()).toBe(true);
    });

    test("getSelectedCell returns undefined when no cell is available", () => {

        const mockNotebookEditor: any = {
            notebook: {
                selectedCell: undefined,
            },
        };
        const mockContextInitializer: any = {};
        
        const actionContext = new ActionContext(mockNotebookEditor, mockContextInitializer);
        expect(actionContext.getSelectedCell()).toBeUndefined();
    });
    
    test("getCell throws when no cell is available", () => {

        const mockNotebookEditor: any = {
            notebook: {
                selectedCell: undefined,
            },
        };
        const mockContextInitializer: any = {};

        const actionContext = new ActionContext(mockNotebookEditor, mockContextInitializer);
        expect(() => actionContext.getCell()).toThrow();
    });

    test("can get params", () => {

        const mockNotebookEditor: any = {};
        const mockContextInitializer: any = {};
        const mockParams: any = { id: "params" };

        const actionContext = new ActionContext(mockNotebookEditor, mockContextInitializer, mockParams);
        expect(actionContext.getParams()).toBe(mockParams);
    });
});