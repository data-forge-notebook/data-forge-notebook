import _ from "lodash";
import { ICellViewModel } from "../../view-model/cell";
import { NotebookViewModel } from "../../view-model/notebook";
import { expectEventRaised } from "../lib/utils";
import { disableInjector } from "@codecapers/fusion";
import { serializeNotebook } from "../../view-model/serialize";

describe('view-model / notebook-only', () => {

    beforeAll(() => {
        disableInjector();
    });

    //
    // Creates a mock cell view model.
    //
    function createMockCellViewModel(fields: any = {}) {
        const mockCell: any = {
            instanceId: fields.id || "1234",
            cellType: fields.cellType || "code",
            flushChanges: jest.fn(),
            select: jest.fn(),
            deselect: jest.fn(),
            clearOutputs: jest.fn(),
            clearErrors: jest.fn(),
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
        const notebook = new NotebookViewModel(mockStorageId, mockCells, "", false, false);

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
            mockCellViewModel,
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
        const notebook = new NotebookViewModel(mockStorageId, [], undefined, false, false);
        expect(notebook.instanceId).toBeDefined();
        expect(notebook.cells).toEqual([]);
        expect(notebook.unsaved).toBe(false);
        expect(notebook.readOnly).toBe(false);
    });    

    test("can construct with cell", () => {
        const mockCellViewModel = createMockCellViewModel();
        
        const { cells } = createNotebookViewModel([ mockCellViewModel ]);
        
        expect(cells.length).toEqual(1);
        expect(cells[0]).toBeDefined();
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

        const cell1 = createMockCellViewModel({ id: "cell-1" });
        await notebook.addCell(cell1, 0);

        const cell2 = createMockCellViewModel({ id: "cell-2" });
        await notebook.addCell(cell2, 1);

        const cells = notebook.cells;
        expect(cells.length).toEqual(2);
        expect(notebook.cells[0].instanceId).toBe("cell-1");
        expect(notebook.cells[1].instanceId).toBe("cell-2");
    });

    test("can add second cell at start", async () => {        
        const { notebook } = createNotebookViewModel([]);

        const mockCell1 = createMockCellViewModel({ id: "cell-1" });
        const mockCell2 = createMockCellViewModel({ id: "cell-2" });
        await notebook.addCell(mockCell1, 0);
        await notebook.addCell(mockCell2, 0);

        expect(notebook.cells.length).toBe(2);
        expect(notebook.cells[0].instanceId).toBe("cell-2");
        expect(notebook.cells[1].instanceId).toBe("cell-1");
    });

    test("can add cell in the middle", async () => {        
        const { notebook } = createNotebookViewModel([]);

        const mockCell1 = createMockCellViewModel({ id: "cell-1" });
        const mockCell2 = createMockCellViewModel({ id: "cell-2" });
        const mockCell3 = createMockCellViewModel({ id: "cell-3" });
        await notebook.addCell(mockCell1, 0);
        await notebook.addCell(mockCell2, 1);
        await notebook.addCell(mockCell3, 1);

        expect(notebook.cells.length).toBe(3);
        expect(notebook.cells[0].instanceId).toBe("cell-1");
        expect(notebook.cells[1].instanceId).toBe("cell-3");
        expect(notebook.cells[2].instanceId).toBe("cell-2");
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

        const newCell = createMockCellViewModel({ id: "new-cell" });
        await notebook.addCell(newCell, 1);

        const cells = notebook.cells;
        expect(cells.length).toEqual(2);
        expect(cells[0]).toBeDefined();
        expect(cells[1].instanceId).toBe("new-cell");
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

        await notebook.select(cell);

        expect(notebook.selectedCell).toBe(cell);
    });

    test("can get the index of the selected cell", async () => {

        const { notebook, cells } = createNotebookWithCells(3);
        
        const cell = cells[1];

        await notebook.select(cell);

        expect(notebook.getSelectedCellIndex()).toBe(1);
    });

    test("can deselect", async () => {

        const { notebook, cell } = createNotebookWithCell();

        await notebook.select(cell);

        await notebook.deselect();

        expect(notebook.selectedCell).toBeUndefined();
    });

    test("selecting a new cell deselects old cells", async () => {

        const { notebook, cells, mockCellViewModels } = createNotebookWithCells(2);

        const cell1 = cells[0];

        await notebook.select(cell1);

        expect(notebook.selectedCell).toBe(cell1);

        const cell2 = cells[1];

        await notebook.select(cell2);

        expect(mockCellViewModels[0].deselect).toHaveBeenCalled();
        expect(notebook.selectedCell).toBe(cell2);
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

        const { notebook, cells, mockCellViewModels } = createNotebookWithCells(2);

        await notebook.deleteCell(cells[0], true);

        expect(mockCellViewModels[1].select).toHaveBeenCalled();
    });

    test("deleting cell when there is no next cell has no effect", async () => {

        const { notebook, cell } = createNotebookWithCell();

        await notebook.deleteCell(cell, true);

        expect(notebook.cells).toEqual([]);
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

        expect(notebook.findCell(cells[0].instanceId)).toBe(cells[0]);
        expect(notebook.findCell(cells[1].instanceId)).toBe(cells[1]);
        expect(notebook.findCell(cells[2].instanceId)).toBe(cells[2]);
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

        expect(notebook.findNextCell(cells[0].instanceId)).toBe(cells[1]);
    });

    test("finding the next cell returns undefined when there is no next cell", () => {

        const { notebook, cells } = createNotebookWithCells(1);

        expect(notebook.findNextCell(cells[0].instanceId)).toBeUndefined();
    });

    test("finding the prev cell in a empty notebook returns undefined", () => {

        const { notebook } = createNotebookViewModel([]);

        expect(notebook.findPrevCell("1234")).toBeUndefined();
    });

    test("can find the prev cell", () => {

        const { notebook, cells } = createNotebookWithCells(2);

        expect(notebook.findPrevCell(cells[1].instanceId)).toBe(cells[0]);
    });

    test("finding the prev cell returns undefined when there is no prev cell", () => {

        const { notebook, cells } = createNotebookWithCells(1);

        expect(notebook.findPrevCell(cells[0].instanceId)).toBeUndefined();
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

        await notebook.select(cell);

        const caretPosition: any = {};
        cell.getCaretPosition = () => caretPosition; // Mock the caret position provider.

        expect(notebook.getCaretPosition()).toEqual({
            cellIndex: 0,
            cellPosition: caretPosition,
        });
    });

    test("get caret position returns undefined when selected cell has no caret position", async () => {

        const { notebook, cell } = createNotebookWithCell();

        await notebook.select(cell);

        cell.getCaretPosition = () => null; // Mock the caret position provider.

        expect(notebook.getCaretPosition()).toBeUndefined();
    });

    test("notebook is not modified at the start", async () => {

        const { notebook } = createNotebookViewModel([]);

        expect(notebook.modified).toBe(false);
    });
    
    test("can deserialize", () => {

        const mockId: any = {};
        const notebook = NotebookViewModel.deserialize(mockId, false, false, {
            version: 3,
            cells: [],
        });
        expect(notebook.instanceId.length).toBeGreaterThan(0);
        expect(notebook.cells).toEqual([]);
        expect(notebook.storageId).toEqual(mockId);
    });

    test("can clear outputs", async () => {

        const { notebook, mockCellViewModel } = createNotebookWithCell();

        await notebook.clearOutputs();

        expect(mockCellViewModel.clearOutputs).toHaveBeenCalled();
    });

    test("can clear errors", async () => {

        const { notebook, mockCellViewModel } = createNotebookWithCell();

        await notebook.clearErrors();

        expect(mockCellViewModel.clearErrors).toHaveBeenCalled();
    });

    test("can flush changes", async () => {

        const { notebook, mockCellViewModel } = createNotebookWithCell();

        await notebook.flushChanges();

        expect(mockCellViewModel.flushChanges).toHaveBeenCalled();
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
        const notebook = new NotebookViewModel(storageId, [], undefined, false, false);
        expect(serializeNotebook(notebook)).toEqual({
            version: 3,
            cells: [],
        });
    });

    test("can deserialize", () => {
        const storageId: any = {};
        const notebook = NotebookViewModel.deserialize(storageId, false, false, {
            version: 3,
            cells: [],
        });
        expect(notebook.instanceId.length).toBeGreaterThan(0);
        expect(notebook.cells).toEqual([]);
    });

    test("can deserialize with undefined cells", () => {
        const storageId: any = {};
        const notebook = NotebookViewModel.deserialize(storageId, false, false, {
            version: 3,
            cells: undefined,
        } as any);
        expect(notebook.instanceId.length).toBeGreaterThan(0);
        expect(notebook.cells).toEqual([]);
    });

    test("can deserialize with cells", () => {
        const storageId: any = {};
        const serializedCell: any = { cellType: "code" };
        const notebook = NotebookViewModel.deserialize(storageId, false, false, {
            version: 3,
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
                cells: [],
            },
        } as any);
        expect(notebook.instanceId.length).toBeGreaterThan(0);
        expect(notebook.cells).toEqual([]);
    });

    test("can deserialize with sheet and undefined cells", () => {
        const storageId: any = {};
        const notebook = NotebookViewModel.deserialize(storageId, false, false, {
            version: 2,
            sheet: {
                id: "1234",
                cells: undefined,
            },
        } as any);
        expect(notebook.instanceId.length).toBeGreaterThan(0);
        expect(notebook.cells).toEqual([]);
    });
});
