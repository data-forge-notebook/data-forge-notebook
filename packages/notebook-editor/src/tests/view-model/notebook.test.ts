import _ from "lodash";
import { CellModifiedEventHandler, ICellViewModel } from "../../view-model/cell";
import { EditorSelectionChangedEventHandler, TextChangedEventHandler } from "../../view-model/monaco-editor";
import { NotebookViewModel } from "../../view-model/notebook";
import { EventSource } from "utils";
import { expectEventNotRaised, expectEventRaised } from "../lib/utils";
import { disableInjector } from "@codecapers/fusion";

describe('view-model / notebook', () => {

    const defaultNodejsVersion = "v16";

    beforeAll(() => {
        disableInjector();
    });

    //
    // Creates a mock cell view model.
    //
    function createMockCellViewModel(fields: any = {}) {
        const mockCell: any = {
            getId: () => fields.id || "1234",
            getCellType: () => fields.cellType || "code",
            onEditorSelectionChanging: new EventSource<EditorSelectionChangedEventHandler>(),
            onEditorSelectionChanged: new EventSource<EditorSelectionChangedEventHandler>(),
            onModified: new EventSource<CellModifiedEventHandler>(),
            onTextChanged: new EventSource<TextChangedEventHandler>(),
            flushChanges: () => {},
            select: jest.fn(),
            deselect: jest.fn(),
            ...fields,
        };
        return mockCell;
    }

    //
    // Helper function to create the notebook view model.
    //
    function createNotebookViewModel(mockCells: ICellViewModel[]) {
        
        const mockStorageId: any = { 
            a: "orig storage id",
            displayName: () => {
                return "a storage id";
            },
        };
        const notebook = new NotebookViewModel(mockStorageId, "", "", mockCells, "", false, false, defaultNodejsVersion);

        const mockLog: any =  {
            info: () => {},
        };
        notebook.log = mockLog;

        const mockRepository: any = {
            writeNotebook: async () => {},
        };
        notebook.notebookRepository = mockRepository;

        return { 
            notebook, 
            cells: notebook.getCells(),
            mockStorageId, 
            mockRepository,
        };
    }
        
    //
    // Creates a notebook with a single cell.
    //
    function createNotebookWithCell() {
        const mockCellViewModel = createMockCellViewModel();
        const created = createNotebookViewModel([ mockCellViewModel ]);
        const [ cell ] = created.notebook.getCells();
        return { 
            ...created, 
            cell, 
        };
    }

    //
    // Creates a notebook with a multiples cells.
    //
    function createNotebookWithCells(numCells: number) {
        const mockCellViewModels = _.range(0, numCells).map(cellIndex => createMockCellViewModel({ id: cellIndex.toString() }));
        return { 
            ...createNotebookViewModel(mockCellViewModels),
            mockCellViewModels,
        };
    }

    test("can construct", () => {
        const mockStorageId: any = {};
        const theLanguage = "javascript";
        const theNodeJsVersion = "v10.0.0";
        const notebook = new NotebookViewModel(mockStorageId, theNodeJsVersion, theLanguage, [], undefined, false, false, "");
        expect(notebook.getInstanceId()).toBeDefined();
        expect(notebook.getLanguage()).toEqual(theLanguage);
        expect(notebook.getCells()).toEqual([]);
        expect(notebook.getNodejsVersion()).toEqual(theNodeJsVersion);
        expect(notebook.isUnsaved()).toBe(false);
        expect(notebook.isReadOnly()).toBe(false);
    });    

    test("can construct with cell", () => {
        const mockCellViewModel = createMockCellViewModel();
        
        const { cells } = createNotebookViewModel([ mockCellViewModel ]);
        
        expect(cells.length).toEqual(1);
        
        const cell = cells[0];
        expect(cell).toBe(mockCellViewModel);
    });

    test("can construct with multiple cells", () => {
        const mockCellViewModel1 = createMockCellViewModel();
        const mockCellViewModel2 = createMockCellViewModel();

        const { cells } = createNotebookViewModel([ mockCellViewModel1, mockCellViewModel2 ]);

        expect(cells.length).toEqual(2);
        expect(cells[0]).toBeDefined();
        expect(cells[1]).toBeDefined();
    });

    test("can add cells", async () => {
        const { notebook } = createNotebookViewModel([]);

        const cell1 = createMockCellViewModel();
        await notebook.addCell(cell1, 0);

        const cell2 = createMockCellViewModel();
        await notebook.addCell(cell2, 1);

        const cells = notebook.getCells();
        expect(cells.length).toEqual(2);
        expect(cells[0]).toBe(cell1);
        expect(cells[1]).toBe(cell2);
    });

    test("can add second cell at start", async () => {        
        const { notebook } = createNotebookViewModel([]);

        const mockCell1 = createMockCellViewModel();
        const mockCell2 = createMockCellViewModel();
        await notebook.addCell(mockCell1, 0);
        await notebook.addCell(mockCell2, 0);

        expect(notebook.getCells()).toEqual([ mockCell2, mockCell1 ]);
    });

    test("can add cell in the middle", async () => {        
        const { notebook } = createNotebookViewModel([]);

        const mockCell1 = createMockCellViewModel();
        const mockCell2 = createMockCellViewModel();
        const mockCell3 = createMockCellViewModel();
        await notebook.addCell(mockCell1, 0);
        await notebook.addCell(mockCell2, 1);
        await notebook.addCell(mockCell3, 1);

        expect(notebook.getCells()).toEqual([ mockCell1, mockCell3, mockCell2 ]);
    });

    test("throws when adding a cell beyond the range", async () => {

        const { notebook } = createNotebookViewModel([]);
        await expect(() => notebook.addCell(createMockCellViewModel(), 1))
            .rejects
            .toThrow();
    });

    test("adding a cell raises onCellsChanged", async () => {
        const { notebook } = createNotebookViewModel([]);

        await expectEventRaised(notebook, "onCellsChanged", async () => {
            await notebook.addCell(createMockCellViewModel(), 0);
        });
    });

    test("adding a cell raises onModified", async () => {
        const { notebook } = createNotebookViewModel([]);

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
        const { notebook } = createNotebookViewModel([]);

        await expectEventRaised(notebook, "onFlushChanges", async () => {
            await notebook.flushChanges();
        });
    });

    test("adding a cell flushes changes", async () => {
        const { notebook } = createNotebookViewModel([]);

        await expectEventRaised(notebook, "onFlushChanges", async () => {
            await notebook.addCell(createMockCellViewModel(), 0);
        });
    });

    test("flushing changes is forwarded to cells", async () => {
        const { notebook } = createNotebookViewModel([]);

        const flushChanges = jest.fn();
        await notebook.addCell(createMockCellViewModel({ flushChanges }), 0);

        await notebook.flushChanges();
        expect(flushChanges).toHaveBeenCalledTimes(1);
    });

    test("onModified event bubbles up for added cells", async () => {

        const { notebook } = createNotebookViewModel([]);

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

    test("deleting a cell raises onCellsChanged", async () => {

        const { notebook, cell } = createNotebookWithCell();

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

        const { notebook, cell } = createNotebookWithCell();

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
   
    test("can move cell to start", async () => {        
        const { notebook, cells } = createNotebookWithCells(3);

        await notebook.moveCell(2, 0)

        expect(notebook.getCells()).toEqual([ cells[2], cells[0], cells[1] ]);
    });

    test("can move cell to middle", async () => {        
        const { notebook, cells } = createNotebookWithCells(3);

        await notebook.moveCell(0, 1);

        expect(notebook.getCells()).toEqual([ cells[1], cells[0], cells[2] ]);
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

        const { notebook } = createNotebookViewModel([]);

        expect(notebook.findCell("1234")).toBeUndefined();
    });

    test("finding a non existent cell returns undefined", () => {

        const { notebook, cells } = createNotebookWithCells(3);

        expect(notebook.findCell("1234")).toBeUndefined();
    });

    test("finding the next cell in a empty notebook returns undefined", () => {

        const { notebook } = createNotebookViewModel([]);

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

        const { notebook } = createNotebookViewModel([]);

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

        const { notebook } = createNotebookViewModel([]);

        expect(notebook.getFirstCell()).toBeUndefined();
    });

    test("can get last cell", () => {

        const { notebook, cells } = createNotebookWithCells(2);

        expect(notebook.getLastCell()).toBe(cells[1]);
    });

    test("getting last cell returns undefined for empty notebook", () => {

        const { notebook } = createNotebookViewModel([]);

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

        const { notebook } = createNotebookViewModel([]);

        expect(notebook.isModified()).toBe(false);
    });
    
    test("can set the modified flag", async () => {

        const { notebook } = createNotebookViewModel([]);
        await notebook.setModified(true);

        expect(notebook.isModified()).toBe(true);
    });

    test("can clear the modified flag", async () => {

        const { notebook } = createNotebookViewModel([]);
        await notebook.setModified(true);
        await notebook.setModified(false);

        expect(notebook.isModified()).toBe(false);
    });

    test("setting the modified flag raises onModified", async () => {

        const { notebook } = createNotebookViewModel([]);

        await expectEventRaised(notebook, "onModified", async () => {
            await notebook.setModified(true);
        });
    });

    test("clearing the modified flag raises onModified", async () => {

        const { notebook } = createNotebookViewModel([]);

        await notebook.setModified(true);

        await expectEventRaised(notebook, "onModified", async () => {
            await notebook.setModified(false);
        });
    });

    test("clearing the modified flag has no effect when not modified", async () => {

        const { notebook } = createNotebookViewModel([]);

        await expectEventNotRaised(notebook, "onModified", async () => {
            await notebook.setModified(false);
        });
    });

    test("can notify modified", async () => {

        const { notebook } = createNotebookViewModel([]);

        await notebook.notifyModified();

        expect(notebook.isModified()).toBe(true);
    });

    test("can clear the modified flag", async () => {

        const { notebook } = createNotebookViewModel([]);

        await notebook.notifyModified();

        await notebook.clearModified();

        expect(notebook.isModified()).toBe(false);
    });

    test("default Node.js version is returned when not explicitly set", () => {

        const { notebook } = createNotebookViewModel([]);

        expect(notebook.getNodejsVersion()).toEqual(defaultNodejsVersion);
    });


    test("setting Node.js version raises onModfiied", async () => {

        const { notebook } = createNotebookViewModel([]);

        await expectEventRaised(notebook, "onModified", async () => {
            await notebook.setNodejsVersion("v12");
        });
    });

    test("can deserialize", () => {

        const mockId: any = {};
        const theLanguage = "javascript";
        const theNodeJsVersion = "v10.0.0";
        const notebook = NotebookViewModel.deserialize(mockId, false, false, "v16", {
            version: 3,
            nodejs: theNodeJsVersion,
            language: theLanguage,
            cells: [],
        });
        expect(notebook.getInstanceId().length).toBeGreaterThan(0);
        expect(notebook.getLanguage()).toEqual(theLanguage);
        expect(notebook.getCells()).toEqual([]);
        expect(notebook.getStorageId()).toEqual(mockId);
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

        const { notebook } = createNotebookViewModel([]);

        await expectEventRaised(notebook, "onFlushChanges", async () => {
            await notebook.flushChanges();
        });
    });

    test("saving notebook writes the serialized notebook to storage", async () => {

        const { notebook, mockRepository, mockStorageId } = createNotebookViewModel([]);

        mockRepository.writeNotebook = jest.fn();

        await notebook.save();

        expect(mockRepository.writeNotebook).toHaveBeenCalledTimes(1);
        expect(mockRepository.writeNotebook).toHaveBeenCalledWith(expect.objectContaining({}), mockStorageId);
    });

    test("saving notebook flushing changes", async () => {

        const { notebook } = createNotebookViewModel([]);

        await expectEventRaised(notebook, "onFlushChanges", async () => {
            await notebook.save();
        });
    });

    test("saving notebook resets modified flag", async () => {

        const { notebook } = createNotebookViewModel([]);

        notebook.setModified(true);

        expect(notebook.isModified()).toBe(true);

        await notebook.save();

        expect(notebook.isModified()).toBe(false);
    });

    
    test("saving notebook as writes the serialized notebook to storage", async () => {

        const { notebook, mockRepository } = createNotebookViewModel([]);

        mockRepository.writeNotebook = jest.fn();

        const newStorageId: any = { a: "new storage id", displayName: () => "a/path" };
        await notebook.saveAs(newStorageId);

        expect(mockRepository.writeNotebook).toHaveBeenCalledTimes(1);
        expect(mockRepository.writeNotebook).toHaveBeenCalledWith(expect.objectContaining({}), newStorageId);
    });

    test("saving notebook as flushing changes", async () => {

        const { notebook } = createNotebookViewModel([]);

        await expectEventRaised(notebook, "onFlushChanges", async () => {
            const newStorageId: any = { displayName: () => "a/path" };
            await notebook.saveAs(newStorageId);
        });
    });

    test("saving notebook as resets modified flag", async () => {

        const { notebook } = createNotebookViewModel([]);

        notebook.setModified(true);

        expect(notebook.isModified()).toBe(true);

        const newStorageId: any = { 
            displayName: () => "a new path",
        };
        await notebook.saveAs(newStorageId);

        expect(notebook.isModified()).toBe(false);
    });

    test("can serialize", () => {
        const storageId: any = {};
        const theLanguage = "javascript";
        const theNodeJsVersion = "v10.0.0";
        const notebook = new NotebookViewModel(storageId, theNodeJsVersion, theLanguage, [], undefined, false, false, "");
        expect(notebook.serialize()).toEqual({
            version: 3,
            language: theLanguage,
            nodejs: theNodeJsVersion,
            cells: [],
        });
    });

    test("can deserialize", () => {
        const storageId: any = {};
        const theLanguage = "javascript";
        const theNodeJsVersion = "v10.0.0";
        const notebook = NotebookViewModel.deserialize(storageId, false, false, "", {
            version: 3,
            nodejs: theNodeJsVersion,
            language: theLanguage,
            cells: [],
        });
        expect(notebook.getInstanceId().length).toBeGreaterThan(0);
        expect(notebook.getLanguage()).toEqual(theLanguage);
        expect(notebook.getCells()).toEqual([]);
        expect(notebook.getNodejsVersion()).toEqual(theNodeJsVersion);
    });

    test("can deserialize with undefined cells", () => {
        const storageId: any = {};
        const theNodeJsVersion = "v10.0.0";
        const notebook = NotebookViewModel.deserialize(storageId, false, false, "", {
            version: 3,
            nodejs: theNodeJsVersion,
            language: undefined,
            cells: undefined,
        } as any);
        expect(notebook.getInstanceId().length).toBeGreaterThan(0);
        expect(notebook.getLanguage()).toEqual("javascript");
        expect(notebook.getCells()).toEqual([]);
        expect(notebook.getNodejsVersion()).toEqual(theNodeJsVersion);
    });

    test("can deserialize with cells", () => {
        const storageId: any = {};
        const serializedCell: any = { cellType: "code" };
        const notebook = NotebookViewModel.deserialize(storageId, false, false, "", {
            version: 3,
            language: "",
            cells: [
                serializedCell,
            ],
        });
        expect(notebook.getCells().length).toEqual(1);
        expect(notebook.getCells()[0]).toBeDefined();
    });

    test("can deserialize with sheet", () => {
        const storageId: any = {};
        const theNodeJsVersion = "v10.0.0";
        const notebook = NotebookViewModel.deserialize(storageId, false, false, "", {
            version: 2,
            nodejs: theNodeJsVersion,
            sheet: {
                id: "1234",
                language: undefined,
                cells: [],
            },
        } as any);
        expect(notebook.getInstanceId().length).toBeGreaterThan(0);
        expect(notebook.getLanguage()).toEqual("javascript");
        expect(notebook.getCells()).toEqual([]);
        expect(notebook.getNodejsVersion()).toEqual(theNodeJsVersion);
    });

    test("can deserialize with sheet and undefined cells", () => {
        const storageId: any = {};
        const theNodeJsVersion = "v10.0.0";
        const notebook = NotebookViewModel.deserialize(storageId, false, false, "", {
            version: 2,
            nodejs: theNodeJsVersion,
            sheet: {
                id: "1234",
                language: undefined,
                cells: undefined,
            },
        } as any);
        expect(notebook.getInstanceId().length).toBeGreaterThan(0);
        expect(notebook.getLanguage()).toEqual("javascript");
        expect(notebook.getCells()).toEqual([]);
        expect(notebook.getNodejsVersion()).toEqual(theNodeJsVersion);
    });


});
