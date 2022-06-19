import _ from "lodash";
import { CellType } from "../../model/cell";
import { CellModifiedEventHandler, ICellViewModel } from "../../view-model/cell";
import { EditorSelectionChangedEventHandler, TextChangedEventHandler } from "../../view-model/monaco-editor";
import { NotebookViewModel } from "../../view-model/notebook";
import { EventSource } from "../../lib/event-source";
import { expectEventNotRaised, expectEventRaised } from "../lib/utils";
import { INotebook } from "../../model/notebook";

describe('view-model / notebook', () => {

    const defaultNodejsVersion = "v16";

    //
    // Creates a mock cell model.
    //
    function createMockCellModel(fields: any = {}) {
        const mockCell: any = {
            getId: () => fields.id || "1234",
            ...fields,
        };
        return mockCell;
    }

    //
    // Creates a mock cell view model.
    //
    function createMockCellViewModel(fields: any = {}) {
        const mockCell: any = {
            getId: () => fields.id || (fields.model && fields.model.getId()) || "1234",
            onEditorSelectionChanging: new EventSource<EditorSelectionChangedEventHandler>(),
            onEditorSelectionChanged: new EventSource<EditorSelectionChangedEventHandler>(),
            onModified: new EventSource<CellModifiedEventHandler>(),
            onTextChanged: new EventSource<TextChangedEventHandler>(),
            getModel: () => fields.model || {},
            flushChanges: () => {},
            select: jest.fn(),
            deselect: jest.fn(),
            ...fields,
        };
        return mockCell;
    }

    //
    // Creates a mock notebook model.
    //
    function createMockNotebookModel(fields: any = {}) {
        const mockNotebookModel: any = {
            getCells: () => fields.cells || (fields.cell && [ fields.cell ]) || [],
            addCell: jest.fn(),
            deleteCell: jest.fn(),
            moveCell: jest.fn(),
            getNodejsVersion: () => undefined,
            setNodejsVersion: jest.fn(),
        };
        return mockNotebookModel;
    }

    //
    // Helper function to create the notebook view model.
    //
    function createNotebookViewModel(mockNotebookModel: INotebook, mockCells: ICellViewModel[]) {
        
        const notebook = new NotebookViewModel(mockNotebookModel, mockCells, false, false, defaultNodejsVersion);
        return notebook;
    }
    
    
    //
    // Creates an empty notebook.
    //
    function createEmptyNotebook(fields: any = {}) {
        const mockNotebookModel = createMockNotebookModel(fields.model || {});
        const notebook = createNotebookViewModel(mockNotebookModel, []);
        return { notebook, mockNotebookModel };
    }

    //
    // Creates a notebook with a single cell.
    //
    function createNotebookWithCell() {
        const mockCellModel = createMockCellModel();
        const mockCellViewModel = createMockCellViewModel({ model: mockCellModel });
        const mockNotebookModel = createMockNotebookModel({ cell: mockCellModel });
        const notebook = createNotebookViewModel(mockNotebookModel, [ mockCellViewModel ]);
        const [ cell ] = notebook.getCells();
        return { notebook, cell, mockCellModel, mockNotebookModel };
    }

    //
    // Creates a notebook with a multiples cells.
    //
    function createNotebookWithCells(numCells: number) {
        const mockCellModels = _.range(0, numCells)
            .map((cellIndex) => createMockCellModel({
                id: cellIndex.toString(),
            }));
        const mockCellViewModels = mockCellModels.map(mockCellModel => {
            return createMockCellViewModel({ model: mockCellModel })
        });
        const mockNotebookModel = createMockNotebookModel({ cells: mockCellModels }); 
        const notebook = createNotebookViewModel(mockNotebookModel, mockCellViewModels);
        const cells = notebook.getCells();
        return { 
            notebook, 
            cells, 
            mockCellModels,
            mockNotebookModel,
        };
    }

    test("can construct", () => {

        const instanceId = "1234";
        const language = "javascript";
        const fileName = "a-file.notebook";
        const path = "some/path";
        const mockModel: any = {
            getCells: () => [],
            getInstanceId: () => instanceId,
            getLanguage: () => language,
            getFileName: () => fileName,
            getContainingPath: () => path,
        };
        const notebook = createNotebookViewModel(mockModel, []);

        expect(notebook.getInstanceId()).toEqual(instanceId);
        expect(notebook.getLanguage()).toEqual(language);
        expect(notebook.getCells()).toEqual([]);
        expect(notebook.getFileName()).toEqual(fileName);
        expect(notebook.getContainingPath()).toEqual(path);
        expect(notebook.isUnsaved()).toBe(false);
        expect(notebook.isReadOnly()).toBe(false);

    });

    test("can construct with cell", () => {
        const mockCellModel = createMockCellModel();
        const mockCellViewModel = createMockCellViewModel({ model: mockCellModel });
        const mockNotebookModel = createMockNotebookModel({ cell: mockCellModel });
        const notebook = createNotebookViewModel(mockNotebookModel, [ mockCellViewModel ]);
        const cells = notebook.getCells();
        expect(cells.length).toEqual(1);
        
        const cell = cells[0];
        expect(cell).toBe(mockCellViewModel);
    });

    test("can construct with multiple cells", () => {
        const mockCellModel1 = createMockCellModel();
        const mockCellModel2 = createMockCellModel();
        const mockCellViewModel1 = createMockCellViewModel({ model: mockCellModel1 });
        const mockCellViewModel2 = createMockCellViewModel({ model: mockCellModel2 });
        const mockNotebookModel = createMockNotebookModel({ cells: [ mockCellModel1, mockCellModel2 ] });
        const notebook = createNotebookViewModel(mockNotebookModel, [ mockCellViewModel1, mockCellViewModel2 ]);
        const cells = notebook.getCells();
        expect(cells.length).toEqual(2);
        expect(cells[0]).toBeDefined();
        expect(cells[1]).toBeDefined();
    });

    test("can add cells", async () => {
        const { notebook } = createEmptyNotebook();

        const cell1 = createMockCellViewModel();
        await notebook.addCell(cell1, 0);

        const cell2 = createMockCellViewModel();
        await notebook.addCell(cell2, 1);

        const cells = notebook.getCells();
        expect(cells.length).toEqual(2);
        expect(cells[0]).toBe(cell1);
        expect(cells[1]).toBe(cell2);
    });

    test("adding a cell to the view-model also adds it to the model", async () => {
        const { notebook, mockNotebookModel } = createEmptyNotebook();

        const cellModel: any = {};
        const cell = createMockCellViewModel();
        await notebook.addCell(cell, 0);

        expect(mockNotebookModel.addCell).toHaveBeenCalledWith(0, cellModel);
    });

    test("adding a cell raises onCellsChanged", async () => {
        const { notebook } = createEmptyNotebook();

        await expectEventRaised(notebook, "onCellsChanged", async () => {
            await notebook.addCell(createMockCellViewModel(), 0);
        });
    });

    test("adding a cell raises onModified", async () => {
        const { notebook } = createEmptyNotebook();

        await expectEventRaised(notebook, "onModified", async () => {
            await notebook.addCell(createMockCellViewModel(), 0);
        });
    });

    test("can construct with a cell then add a new cell", async () => {
        const { notebook } = createNotebookWithCell();

        const newCell = createMockCellViewModel();
        await notebook.addCell(newCell, 1);

        const cells = notebook.getCells();
        expect(cells.length).toEqual(2);
        expect(cells[0]).toBeDefined();
        expect(cells[1]).toBe(newCell);
    });

    test("onModified event bubbles up for initial cells", async () => {
        const { notebook, cell } = createNotebookWithCell();

        await expectEventRaised(notebook, "onModified", async () => {
            await cell.onModified.raise(cell);
        });
    });

    test("flushing changes raises onFlushChanges", async () => {
        const { notebook } = createEmptyNotebook();

        await expectEventRaised(notebook, "onFlushChanges", async () => {
            await notebook.flushChanges();
        });
    });

    test("adding a cell flushes changes", async () => {
        const { notebook } = createEmptyNotebook();

        await expectEventRaised(notebook, "onFlushChanges", async () => {
            await notebook.addCell(createMockCellViewModel(), 0);
        });
    });

    test("flushing changes is forwarded to cells", async () => {
        const { notebook } = createEmptyNotebook();

        const flushChanges = jest.fn();
        await notebook.addCell(createMockCellViewModel({ flushChanges }), 0);

        await notebook.flushChanges();
        expect(flushChanges).toHaveBeenCalledTimes(1);
    });

    test("onModified event bubbles up for added cells", async () => {

        const { notebook } = createEmptyNotebook();

        await expectEventRaised(notebook, "onModified", async () => {
            const mockCell = createMockCellViewModel()
            await notebook.addCell(mockCell, 0);
            await mockCell.onModified.raise();
        });
    });

    test("can select a cell", async () => {

        const { notebook, cell } = createNotebookWithCell();

        await cell.onEditorSelectionChanged.raise(cell);

        expect(notebook.getSelectedCell()).toBe(cell);
    });

    test("can get the index of the selected cell", async () => {

        const { notebook, cells } = createNotebookWithCells(3);
        
        const cell = cells[1];
        await cell.onEditorSelectionChanged.raise(cell);

        expect(notebook.getSelectedCellIndex()).toBe(1);
    });

    test("can deselect", async () => {

        const { notebook, cell } = createNotebookWithCell();
        await cell.select();

        await notebook.deselect();

        expect(notebook.getSelectedCell()).toBeUndefined();
    });

    test("selecting a new cell deselects old cells", async () => {

        const { notebook, cells } = createNotebookWithCells(2);

        const cell1 = cells[0];

        await cell1.onEditorSelectionChanged.raise(cell1);

        expect(notebook.getSelectedCell()).toBe(cell1);

        const cell2 = cells[1];

        await cell2.onEditorSelectionChanging.raise(cell2, true);

        expect(cell1.deselect).toHaveBeenCalled();

        await cell2.onEditorSelectionChanged.raise(cell2);

        expect(notebook.getSelectedCell()).toBe(cell2);
    });

    test("selecting a cell raises onSelectedCellChanged", async () => {

        const { notebook, cell } = createNotebookWithCell();

        await expectEventRaised(notebook, "onSelectedCellChanged", async () => {
            await cell.onEditorSelectionChanged.raise(cell);
        });
    });

    test("can get index for cell", () => {
        
        const { notebook, cells } = createNotebookWithCells(2);
        expect(notebook.getCellIndex(cells[0])).toBe(0);
        expect(notebook.getCellIndex(cells[1])).toBe(1);
    });

    test("can get cell by index", () => {
        
        const { notebook, cells } = createNotebookWithCells(2);
        expect(notebook.getCellByIndex(0)).toBe(cells[0]);
        expect(notebook.getCellByIndex(1)).toBe(cells[1]);
    });

    test("can delete only cell", async () => {

        const { notebook, cell } = createNotebookWithCell();

        await notebook.deleteCell(cell, false);

        expect(notebook.getCells()).toEqual([]);
    });

    test("can delete cell when there are other cells", async () => {

        const { notebook, cells } = createNotebookWithCells(3);

        await notebook.deleteCell(cells[1], false);

        expect(notebook.getCells()).toEqual([
            cells[0],
            cells[2],
        ]);
    });
    
    test("deleting a cell selects the next cell", async () => {

        const { notebook, cells } = createNotebookWithCells(2);

        await notebook.deleteCell(cells[0], true);

        expect(cells[1].select).toHaveBeenCalled();
    });

    test("deleting cell when there is no next cell has no effect", async () => {

        const { notebook, cell } = createNotebookWithCell();

        await notebook.deleteCell(cell, true);

        expect(notebook.getCells()).toEqual([]);
    });

    test("deleting a cell removes it from the model", async () => {

        const { notebook, cell, mockNotebookModel } = createNotebookWithCell();

        await notebook.deleteCell(cell, false);

        expect(mockNotebookModel.deleteCell).toHaveBeenCalledWith(cell.getId());
    });

    test("deleting a cell raises onCellsChanged", async () => {

        const { notebook, cell, mockNotebookModel } = createNotebookWithCell();

        await expectEventRaised(notebook, "onCellsChanged", async () => {
            await notebook.deleteCell(cell, false);
        });
    });

    test("deleting a cell unhooks cell events", async () => {

        const { notebook, cell } = createNotebookWithCell();

        await notebook.deleteCell(cell, false);

        //
        // Events should no longer be propagated up from the deleted cell.
        //
        await expectEventNotRaised(notebook, "onSelectedCellChanged", async () => {
            await cell.onEditorSelectionChanged.raise(cell);
        });
    });

    test("deleting a cell raises onModified", async () => {

        const { notebook, cell, mockNotebookModel } = createNotebookWithCell();

        await expectEventRaised(notebook, "onModified", async () => {
            await notebook.deleteCell(cell, false);
        });
    });

    test("can move a cell", async () => {

       const { notebook, cells } = createNotebookWithCells(3);

       await notebook.moveCell(0, 2);

       expect(notebook.getCells()).toEqual([
           cells[1],
           cells[2],
           cells[0],
       ]);
    });
   
    test("moving a cell moves it from the model", async () => {

        const { notebook, mockNotebookModel } = createNotebookWithCells(3);

        await notebook.moveCell(0, 2);
 
        expect(mockNotebookModel.moveCell).toHaveBeenCalledWith(0, 2);
    });

    test("moving a cell raises onCellsChanged", async () => {

        const { notebook } = createNotebookWithCells(3);

        await expectEventRaised(notebook, "onCellsChanged", async () => {
            await notebook.moveCell(0, 2);
        });
    });

    test("moving a cell raises onModified", async () => {

        const { notebook } = createNotebookWithCells(3);

        await expectEventRaised(notebook, "onModified", async () => {
            await notebook.moveCell(0, 2);
        });
    });

    test("can get cell index by id", () => {

        const { notebook, cells } = createNotebookWithCells(3);

        expect(notebook.getCellIndex(cells[0])).toBe(0);
        expect(notebook.getCellIndex(cells[1])).toBe(1);
        expect(notebook.getCellIndex(cells[2])).toBe(2);
    });

    test("can get cell index by id after moving the cell", async () => {

        const { notebook, cells } = createNotebookWithCells(3);

        await notebook.moveCell(0, 2);

        expect(notebook.getCellIndex(cells[1])).toBe(0);
        expect(notebook.getCellIndex(cells[2])).toBe(1);
        expect(notebook.getCellIndex(cells[0])).toBe(2);
    });

    test("can find cell", () => {

        const { notebook, cells } = createNotebookWithCells(3);

        expect(notebook.findCell(cells[0].getId())).toBe(cells[0]);
        expect(notebook.findCell(cells[1].getId())).toBe(cells[1]);
        expect(notebook.findCell(cells[2].getId())).toBe(cells[2]);
    });

    test("finding a cell in a empty notebook returns undefined", () => {

        const { notebook } = createEmptyNotebook();

        expect(notebook.findCell("1234")).toBeUndefined();
    });

    test("finding a non existent cell returns undefined", () => {

        const { notebook, cells } = createNotebookWithCells(3);

        expect(notebook.findCell("1234")).toBeUndefined();
    });

    test("finding the next cell in a empty notebook returns undefined", () => {

        const { notebook } = createEmptyNotebook();

        expect(notebook.findNextCell("1234")).toBeUndefined();
    });

    test("can find the next cell", () => {

        const { notebook, cells } = createNotebookWithCells(2);

        expect(notebook.findNextCell(cells[0].getId())).toBe(cells[1]);
    });

    test("finding the next cell returns undefined when there is no next cell", () => {

        const { notebook, cells } = createNotebookWithCells(1);

        expect(notebook.findNextCell(cells[0].getId())).toBeUndefined();
    });

    test("finding the prev cell in a empty notebook returns undefined", () => {

        const { notebook } = createEmptyNotebook();

        expect(notebook.findPrevCell("1234")).toBeUndefined();
    });

    test("can find the prev cell", () => {

        const { notebook, cells } = createNotebookWithCells(2);

        expect(notebook.findPrevCell(cells[1].getId())).toBe(cells[0]);
    });

    test("finding the prev cell returns undefined when there is no prev cell", () => {

        const { notebook, cells } = createNotebookWithCells(1);

        expect(notebook.findPrevCell(cells[0].getId())).toBeUndefined();
    });

    test("can get first cell", () => {

        const { notebook, cells } = createNotebookWithCells(2);

        expect(notebook.getFirstCell()).toBe(cells[0]);
    });

    test("getting first cell returns undefined for empty notebook", () => {

        const { notebook } = createEmptyNotebook();

        expect(notebook.getFirstCell()).toBeUndefined();
    });

    test("can get last cell", () => {

        const { notebook, cells } = createNotebookWithCells(2);

        expect(notebook.getLastCell()).toBe(cells[1]);
    });

    test("getting last cell returns undefined for empty notebook", () => {

        const { notebook } = createEmptyNotebook();

        expect(notebook.getLastCell()).toBeUndefined();
    });

    test("get caret position returns undefined when no cell is selected", () => {

        const { notebook } = createNotebookWithCells(2);

        expect(notebook.getCaretPosition()).toBeUndefined();
    });

    test("get caret position returns the value for the selected cell", async () => {

        const { notebook, cell } = createNotebookWithCell();

        await cell.onEditorSelectionChanged.raise(cell);

        const caretPosition: any = {};
        cell.getCaretPosition = () => caretPosition; // Mock the caret position provider.

        expect(notebook.getCaretPosition()).toEqual({
            cellIndex: 0,
            cellPosition: caretPosition,
        });
    });

    test("get caret position returns undefined when selected cell has no caret position", async () => {

        const { notebook, cell } = createNotebookWithCell();

        await cell.onEditorSelectionChanged.raise(cell);

        cell.getCaretPosition = () => null; // Mock the caret position provider.

        expect(notebook.getCaretPosition()).toBeUndefined();
    });

    test("notebook is not modified at the start", async () => {

        const { notebook } = createEmptyNotebook();

        expect(notebook.isModified()).toBe(false);
    });
    
    test("can set the modified flag", async () => {

        const { notebook } = createEmptyNotebook();
        await notebook.setModified(true);

        expect(notebook.isModified()).toBe(true);
    });

    test("can clear the modified flag", async () => {

        const { notebook } = createEmptyNotebook();
        await notebook.setModified(true);
        await notebook.setModified(false);

        expect(notebook.isModified()).toBe(false);
    });

    test("setting the modified flag raises onModified", async () => {

        const { notebook } = createEmptyNotebook();

        await expectEventRaised(notebook, "onModified", async () => {
            await notebook.setModified(true);
        });
    });

    test("clearing the modified flag raises onModified", async () => {

        const { notebook } = createEmptyNotebook();

        await notebook.setModified(true);

        await expectEventRaised(notebook, "onModified", async () => {
            await notebook.setModified(false);
        });
    });

    test("clearing the modified flag has no effect when not modified", async () => {

        const { notebook } = createEmptyNotebook();

        await expectEventNotRaised(notebook, "onModified", async () => {
            await notebook.setModified(false);
        });
    });

    test("can notify modified", async () => {

        const { notebook } = createEmptyNotebook();

        await notebook.notifyModified();

        expect(notebook.isModified()).toBe(true);
    });

    test("can clear the modified flag", async () => {

        const { notebook } = createEmptyNotebook();

        await notebook.notifyModified();

        await notebook.clearModified();

        expect(notebook.isModified()).toBe(false);
    });

    test("default Node.js version is returned when not explicitly set", () => {

        const { notebook } = createEmptyNotebook();

        expect(notebook.getNodejsVersion()).toEqual(defaultNodejsVersion);
    });

    test("when Node.js version is set on the model that is returned", async () => {

        const { notebook, mockNotebookModel } = createEmptyNotebook();

        const nodejsVersion = "v12";
        mockNotebookModel.getNodejsVersion = () => nodejsVersion;

        expect(notebook.getNodejsVersion()).toEqual(nodejsVersion);
    });

    test("setting Node.js version sets on the model", async () => {

        const { notebook, mockNotebookModel } = createEmptyNotebook();

        const nodejsVersion = "v12";
        await notebook.setNodejsVersion(nodejsVersion);

        expect(mockNotebookModel.setNodejsVersion).toBeCalledWith(nodejsVersion);
    });

    test("setting Node.js version raises onModfiied", async () => {

        const { notebook } = createEmptyNotebook();

        await expectEventRaised(notebook, "onModified", async () => {
            await notebook.setNodejsVersion("v12");
        });
    });

    test("serialize forwards to the model", () => {

        const { notebook, mockNotebookModel } = createEmptyNotebook();

        const serialized = {};
        mockNotebookModel.serialize = () => serialized;

        expect(notebook.serialize()).toBe(serialized);
    });

    test("can deserialize", () => {

        const theFileName = "something.notebook";
        const thePath = "/a/path";
        const theLanguage = "javascript";
        const theNodeJsVersion = "v10.0.0";
        const notebook = NotebookViewModel.deserialize(theFileName, false, false, thePath, "v16", {
            version: 3,
            nodejs: theNodeJsVersion,
            language: theLanguage,
            cells: [],
        });
        expect(notebook.getInstanceId().length).toBeGreaterThan(0);
        expect(notebook.getLanguage()).toEqual(theLanguage);
        expect(notebook.getCells()).toEqual([]);
        expect(notebook.getFileName()).toEqual(theFileName);
        expect(notebook.getContainingPath()).toEqual(thePath);
        expect(notebook.getNodejsVersion()).toEqual(theNodeJsVersion);
    });

    test("can clear outputs", async () => {

        const { notebook, cell } = createNotebookWithCell();

        cell.clearOutputs = jest.fn();

        await notebook.clearOutputs();

        expect(cell.clearOutputs).toHaveBeenCalled();
    });

    test("can clear errors", async () => {

        const { notebook, cell } = createNotebookWithCell();

        cell.clearErrors = jest.fn();

        await notebook.clearErrors();

        expect(cell.clearErrors).toHaveBeenCalled();
    });

    test("can flush changes", async () => {

        const { notebook, cell } = createNotebookWithCell();

        cell.flushChanges = jest.fn();

        await notebook.flushChanges();

        expect(cell.flushChanges).toHaveBeenCalled();
    });

    test("calling flush changes raises onFlushChanges", async () => {

        const { notebook } = createEmptyNotebook();

        await expectEventRaised(notebook, "onFlushChanges", async () => {
            await notebook.flushChanges();
        });
    });

});
