import _ from "lodash";
import { CellModifiedEventHandler, EditorSelectionChangedEventHandler, ICellViewModel, TextChangedEventHandler } from "../../view-model/cell";
import { NotebookViewModel } from "../../view-model/notebook";
import { EventSource } from "utils";
import { expectEventNotRaised, expectEventRaised } from "../lib/utils";
import { disableInjector } from "@codecapers/fusion";

describe('view-model / notebook', () => {

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
        const notebook = new NotebookViewModel(mockStorageId, "", mockCells, "", false, false);

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
            cells: notebook.cells,
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
        const [ cell ] = created.notebook.cells;
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
        const notebook = new NotebookViewModel(mockStorageId, theLanguage, [], undefined, false, false);
        expect(notebook.instanceId).toBeDefined();
        expect(notebook.language).toEqual(theLanguage);
        expect(notebook.cells).toEqual([]);
        expect(notebook.unsaved).toBe(false);
        expect(notebook.readOnly).toBe(false);
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

        const cells = notebook.cells;
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

        expect(notebook.cells).toEqual([ mockCell2, mockCell1 ]);
    });

    test("can add cell in the middle", async () => {        
        const { notebook } = createNotebookViewModel([]);

        const mockCell1 = createMockCellViewModel();
        const mockCell2 = createMockCellViewModel();
        const mockCell3 = createMockCellViewModel();
        await notebook.addCell(mockCell1, 0);
        await notebook.addCell(mockCell2, 1);
        await notebook.addCell(mockCell3, 1);

        expect(notebook.cells).toEqual([ mockCell1, mockCell3, mockCell2 ]);
    });

    test("throws when adding a cell beyond the range", async () => {

        const { notebook } = createNotebookViewModel([]);
        await expect(() => notebook.addCell(createMockCellViewModel(), 1))
            .rejects
            .toThrow();
    });

    test("adding a cell sets the modified flag", async () => {
        const { notebook } = createNotebookViewModel([]);
        
        expect(notebook.modified).toBe(false);

        await notebook.addCell(createMockCellViewModel(), 0);

        expect(notebook.modified).toBe(true);
    });

    test("can construct with a cell then add a new cell", async () => {
        const { notebook } = createNotebookWithCell();

        const newCell = createMockCellViewModel();
        await notebook.addCell(newCell, 1);

        const cells = notebook.cells;
        expect(cells.length).toEqual(2);
        expect(cells[0]).toBeDefined();
        expect(cells[1]).toBe(newCell);
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

    test("can select a cell", async () => {

        const { notebook, cell } = createNotebookWithCell();

        await cell.onEditorSelectionChanged.raise(cell);

        expect(notebook.selectedCell).toBe(cell);
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

        expect(notebook.selectedCell).toBeUndefined();
    });

    test("selecting a new cell deselects old cells", async () => {

        const { notebook, cells } = createNotebookWithCells(2);

        const cell1 = cells[0];

        await cell1.onEditorSelectionChanged.raise(cell1);

        expect(notebook.selectedCell).toBe(cell1);

        const cell2 = cells[1];

        await cell2.onEditorSelectionChanging.raise(cell2, true);

        expect(cell1.deselect).toHaveBeenCalled();

        await cell2.onEditorSelectionChanged.raise(cell2);

        expect(notebook.selectedCell).toBe(cell2);
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

        expect(notebook.cells).toEqual([]);
    });

    test("can delete cell when there are other cells", async () => {

        const { notebook, cells } = createNotebookWithCells(3);

        await notebook.deleteCell(cells[1], false);

        expect(notebook.cells).toEqual([
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

        expect(notebook.cells).toEqual([]);
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

    test("deleting a cell sets the modified flag", async () => {

        const { notebook, cell } = createNotebookWithCell();

        expect(notebook.modified).toBe(false);

        await notebook.deleteCell(cell, false);

        expect(notebook.modified).toBe(true);
    });

    test("can move a cell", async () => {
       const { notebook, cells } = createNotebookWithCells(3);

       await notebook.moveCell(0, 2);

       expect(notebook.cells).toEqual([
           cells[1],
           cells[2],
           cells[0],
       ]);
    });
   
    test("can move cell to start", async () => {        
        const { notebook, cells } = createNotebookWithCells(3);

        await notebook.moveCell(2, 0)

        expect(notebook.cells).toEqual([ cells[2], cells[0], cells[1] ]);
    });

    test("can move cell to middle", async () => {        
        const { notebook, cells } = createNotebookWithCells(3);

        await notebook.moveCell(0, 1);

        expect(notebook.cells).toEqual([ cells[1], cells[0], cells[2] ]);
    });

    test("moving a cell sets the modified flag", async () => {
        const { notebook } = createNotebookWithCells(3);

        expect(notebook.modified).toBe(false);

        await notebook.moveCell(0, 2);

        expect(notebook.modified).toBe(true);
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

        expect(notebook.findCell(cells[0].id)).toBe(cells[0]);
        expect(notebook.findCell(cells[1].id)).toBe(cells[1]);
        expect(notebook.findCell(cells[2].id)).toBe(cells[2]);
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

        expect(notebook.findNextCell(cells[0].id)).toBe(cells[1]);
    });

    test("finding the next cell returns undefined when there is no next cell", () => {

        const { notebook, cells } = createNotebookWithCells(1);

        expect(notebook.findNextCell(cells[0].id)).toBeUndefined();
    });

    test("finding the prev cell in a empty notebook returns undefined", () => {

        const { notebook } = createNotebookViewModel([]);

        expect(notebook.findPrevCell("1234")).toBeUndefined();
    });

    test("can find the prev cell", () => {

        const { notebook, cells } = createNotebookWithCells(2);

        expect(notebook.findPrevCell(cells[1].id)).toBe(cells[0]);
    });

    test("finding the prev cell returns undefined when there is no prev cell", () => {

        const { notebook, cells } = createNotebookWithCells(1);

        expect(notebook.findPrevCell(cells[0].id)).toBeUndefined();
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

        expect(notebook.modified).toBe(false);
    });
    
    test("can deserialize", () => {

        const mockId: any = {};
        const theLanguage = "javascript";
        const notebook = NotebookViewModel.deserialize(mockId, false, false, {
            version: 3,
            language: theLanguage,
            cells: [],
        });
        expect(notebook.instanceId.length).toBeGreaterThan(0);
        expect(notebook.language).toEqual(theLanguage);
        expect(notebook.cells).toEqual([]);
        expect(notebook.storageId).toEqual(mockId);
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

        notebook.modified = true;

        expect(notebook.modified).toBe(true);

        await notebook.save();

        expect(notebook.modified).toBe(false);
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

        notebook.modified = true;

        expect(notebook.modified).toBe(true);

        const newStorageId: any = { 
            displayName: () => "a new path",
        };
        await notebook.saveAs(newStorageId);

        expect(notebook.modified).toBe(false);
    });

    test("can serialize", () => {
        const storageId: any = {};
        const theLanguage = "javascript";
        const notebook = new NotebookViewModel(storageId, theLanguage, [], undefined, false, false);
        expect(notebook.serialize()).toEqual({
            version: 3,
            language: theLanguage,
            cells: [],
        });
    });

    test("can deserialize", () => {
        const storageId: any = {};
        const theLanguage = "javascript";
        const notebook = NotebookViewModel.deserialize(storageId, false, false, {
            version: 3,
            language: theLanguage,
            cells: [],
        });
        expect(notebook.instanceId.length).toBeGreaterThan(0);
        expect(notebook.language).toEqual(theLanguage);
        expect(notebook.cells).toEqual([]);
    });

    test("can deserialize with undefined cells", () => {
        const storageId: any = {};
        const notebook = NotebookViewModel.deserialize(storageId, false, false, {
            version: 3,
            language: undefined,
            cells: undefined,
        } as any);
        expect(notebook.instanceId.length).toBeGreaterThan(0);
        expect(notebook.language).toEqual("javascript");
        expect(notebook.cells).toEqual([]);
    });

    test("can deserialize with cells", () => {
        const storageId: any = {};
        const serializedCell: any = { cellType: "code" };
        const notebook = NotebookViewModel.deserialize(storageId, false, false, {
            version: 3,
            language: "",
            cells: [
                serializedCell,
            ],
        });
        expect(notebook.cells.length).toEqual(1);
        expect(notebook.cells[0]).toBeDefined();
    });

    test("can deserialize with sheet", () => {
        const storageId: any = {};
        const notebook = NotebookViewModel.deserialize(storageId, false, false, {
            version: 2,
            sheet: {
                id: "1234",
                language: undefined,
                cells: [],
            },
        } as any);
        expect(notebook.instanceId.length).toBeGreaterThan(0);
        expect(notebook.language).toEqual("javascript");
        expect(notebook.cells).toEqual([]);
    });

    test("can deserialize with sheet and undefined cells", () => {
        const storageId: any = {};
        const notebook = NotebookViewModel.deserialize(storageId, false, false, {
            version: 2,
            sheet: {
                id: "1234",
                language: undefined,
                cells: undefined,
            },
        } as any);
        expect(notebook.instanceId.length).toBeGreaterThan(0);
        expect(notebook.language).toEqual("javascript");
        expect(notebook.cells).toEqual([]);
    });
});
