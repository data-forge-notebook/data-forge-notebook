import { disableInjector } from "@codecapers/fusion";
import { IChange, UndoRedo } from "../../services/undoredo";
import { IEditorCaretPosition } from "../../view-model/editor-caret-position";

describe('services / undoredo', () => {

    let mockSelect: jest.Mock<any, any>;
    let mockMakeUnmodified: jest.Mock<any, any>;
    let mockSetModified: jest.Mock<any, any>;
    let mockNotebook: any;
    let service: UndoRedo;

    beforeAll(() => {
        disableInjector();
    });

    beforeEach(() => {
        mockSelect = jest.fn();
        mockMakeUnmodified = jest.fn();
        mockSetModified = jest.fn();
        mockNotebook = {
            modified: false,
            makeUnmodified: mockMakeUnmodified,
            setModified: mockSetModified,
            flushChanges: () => {},
            getCellIndex: () => 0,
            getCaretPosition: () => undefined,
            select: mockSelect,
        };
        service = new UndoRedo();
        const mockLog: any = {
            info: () => {},
        };
        service.log = mockLog;
        service.clearStack(mockNotebook);
    });

    function makeMockChange(config?: any): IChange[] {
        const mockChange: any = {
            do: config && config.do || (() => {}),
            undo: config && config.undo || (() => {}),
            redo: config && config.redo || (() => {}),
            dumpState: () => "",
        };   
        return [mockChange];
    }

    test('inital stack has zero items', ()  => {

        expect(service.getNumLevels()).toEqual(0);
    });

    test('check initial state', () => {

        expect(service.getNumLevels()).toEqual(0);
        expect(service.atStart()).toEqual(true);
        expect(service.atEnd()).toEqual(true);
    });
    
    test('cannot undo inital state', async () => {

        expect(service.movePrevious()).rejects.toThrowError();
    });

    test('cannot move forward after inital change', async () => {

        expect(service.moveNext()).rejects.toThrowError();
    });

    test('can make first change', async () => {

        const mockDo = jest.fn();
        await service.applyChanges(makeMockChange({ do: mockDo }));

        expect(service.getNumLevels()).toEqual(1);
        expect(service.atStart()).toEqual(false);
        expect(service.atEnd()).toEqual(true);
        expect(mockDo).toHaveBeenCalledTimes(1);
    });
    
    test('can undo first change', async () => {

        const mockUndo = jest.fn();
        await service.applyChanges(makeMockChange({ undo: mockUndo }));

        await service.movePrevious();

        expect(service.atStart()).toEqual(true);
        expect(service.atEnd()).toEqual(false);
        expect(mockUndo).toHaveBeenCalledTimes(1);
    });

    test('cannot move backward after undoing first change', async () => {

        await service.applyChanges(makeMockChange());
        await service.movePrevious();

        expect(service.movePrevious()).rejects.toThrowError();
    });

    test('cannot move forward when at end', async () => {

        await service.applyChanges(makeMockChange());

        expect(service.moveNext()).rejects.toThrowError();
    });

    test('can undo then redo first change', async () => {

        const mockDo = jest.fn();
        const mockRedo = jest.fn();
        await service.applyChanges(makeMockChange({ do: mockDo, redo: mockRedo }));

        await service.movePrevious();
        await service.moveNext();

        expect(service.atStart()).toEqual(false);
        expect(service.atEnd()).toEqual(true);
        expect(mockDo).toHaveBeenCalledTimes(1);
        expect(mockRedo).toHaveBeenCalledTimes(1);
    });

    test('can undo, then redo, then undo again', async () => {

        const mockUndo = jest.fn();
        await service.applyChanges(makeMockChange({ undo: mockUndo }));

        await service.movePrevious();
        await service.moveNext();
        await service.movePrevious();

        expect(service.atStart()).toEqual(true);
        expect(service.atEnd()).toEqual(false);
        expect(mockUndo).toHaveBeenCalledTimes(2);
    });

    test('can undo, then redo, then undo, then redo again', async () => {

        const mockDo = jest.fn();
        const mockRedo = jest.fn();
        await service.applyChanges(makeMockChange({ do: mockDo, redo: mockRedo }));

        await service.movePrevious();
        await service.moveNext();
        await service.movePrevious();
        await service.moveNext();

        expect(service.atStart()).toEqual(false);
        expect(service.atEnd()).toEqual(true);
        expect(mockDo).toHaveBeenCalledTimes(1);
        expect(mockRedo).toHaveBeenCalledTimes(2);
    });
    
    test('the stack is cleared when doing new actions after undo', async () => {

        const mockDo = jest.fn();
        await service.applyChanges(makeMockChange());
        await service.applyChanges(makeMockChange());
        await service.applyChanges(makeMockChange());

        expect(service.getNumLevels()).toBe(3);

        await service.movePrevious();
        await service.movePrevious();
        await service.movePrevious();

        expect(service.getNumLevels()).toBe(3);

        await service.applyChanges(makeMockChange());

        expect(service.getNumLevels()).toBe(1);
    });

    test('cannot move forward after redoing the most recent change', async () => {

        await service.applyChanges(makeMockChange());
        await service.movePrevious();
        await service.moveNext();

        expect(service.moveNext()).rejects.toThrowError();
    });

    test('can make two changes', async () => {

        const mockDo1 = jest.fn();
        await service.applyChanges(makeMockChange({ do: mockDo1 }));

        const mockDo2 = jest.fn();
        await service.applyChanges(makeMockChange({ do: mockDo2 }));

        expect(service.getNumLevels()).toEqual(2);
        expect(service.atStart()).toEqual(false);
        expect(service.atEnd()).toEqual(true);
        expect(mockDo1).toBeCalledTimes(1);
        expect(mockDo2).toBeCalledTimes(1);
    });
    
    test('can undo second change', async () => {

        await service.applyChanges(makeMockChange());

        const mockUndo = jest.fn();
        await service.applyChanges(makeMockChange({ undo: mockUndo }));

        await service.movePrevious();

        expect(service.atStart()).toEqual(false);
        expect(service.atEnd()).toEqual(false);
        expect(mockUndo).toBeCalledTimes(1);
    });

    test('can undo then redo second change', async () => {

        await service.applyChanges(makeMockChange());

        const mockDo = jest.fn();
        const mockRedo = jest.fn();
        await service.applyChanges(makeMockChange({ do: mockDo, redo: mockRedo }));
        
        await service.movePrevious();
        await service.moveNext();

        expect(service.atStart()).toEqual(false);
        expect(service.atEnd()).toEqual(true);
        expect(mockDo).toBeCalledTimes(1);
        expect(mockRedo).toBeCalledTimes(1);
    });
    
    test('can undo two changes', async () => {

        const mockUndo1 = jest.fn();
        await service.applyChanges(makeMockChange({ undo: mockUndo1 }));

        const mockUndo2 = jest.fn();
        await service.applyChanges(makeMockChange({ undo: mockUndo2 }));

        await service.movePrevious();
        await service.movePrevious();

        expect(service.atStart()).toEqual(true);
        expect(service.atEnd()).toEqual(false);
        expect(mockUndo1).toBeCalledTimes(1);
        expect(mockUndo2).toBeCalledTimes(1);
    });

    test('can redo two changes', async () => {

        const mockDo1 = jest.fn();
        const mockRedo1 = jest.fn();
        await service.applyChanges(makeMockChange({ do: mockDo1, redo: mockRedo1 }));

        const mockDo2 = jest.fn();
        const mockRedo2 = jest.fn();
        await service.applyChanges(makeMockChange({ do: mockDo2, redo: mockRedo2 }));

        await service.movePrevious();
        await service.movePrevious();
        await service.moveNext();
        await service.moveNext();

        expect(service.atStart()).toEqual(false);
        expect(service.atEnd()).toEqual(true);
        expect(mockDo1).toBeCalledTimes(1);
        expect(mockRedo1).toBeCalledTimes(1);
        expect(mockDo2).toBeCalledTimes(1);
        expect(mockRedo2).toBeCalledTimes(1);
    });

    test('adding more than max changes causes early changes to be discarded', async () => {

        service.MAX_UNDO_REDO_STACK_SIZE = 2;

        await service.applyChanges(makeMockChange());
        await service.applyChanges(makeMockChange());
        await service.applyChanges(makeMockChange());
        await service.applyChanges(makeMockChange());

        expect(service.getNumLevels()).toEqual(2);
        expect(service.atEnd()).toEqual(true);
    });

    test('can clear stack from empty state', () => {

        service.clearStack(mockNotebook);
    });
    
    test('can clear changes from stack', async () => {

        await service.applyChanges(makeMockChange());
        await service.applyChanges(makeMockChange());

        service.clearStack(mockNotebook);

        expect(service.getNumLevels()).toEqual(0);
        expect(service.atStart()).toEqual(true);
        expect(service.atEnd()).toEqual(true);
    });

    test('can clear stack then add new changes', async () => {

        await service.applyChanges(makeMockChange());
        await service.applyChanges(makeMockChange());

        service.clearStack(mockNotebook);

        await service.applyChanges(makeMockChange());

        expect(service.getNumLevels()).toEqual(1);
        expect(service.atStart()).toEqual(false);
        expect(service.atEnd()).toEqual(true);
    });

    test("undoing a change can set notebook to modified state", async () => {

        mockNotebook.isModified = true;

        await service.applyChanges(makeMockChange());
        await service.movePrevious();

        expect(mockSetModified).toBeCalledTimes(1);
        expect(mockSetModified).toBeCalledWith(true);
    });

    test("undoing a change can clear notebook modified state", async () => {

        mockNotebook.isModified = false;

        await service.applyChanges(makeMockChange());
        await service.movePrevious();

        expect(mockSetModified).toBeCalledTimes(1);
        expect(mockSetModified).toBeCalledWith(false);
    });

    test("undoing a change can set caret position", async () => {

        mockNotebook.isModified = true;

        const caretPosition: IEditorCaretPosition = {
            lineNumber: 5,
            column: 3,
        };
        mockNotebook.getCaretPosition = () => ({
            cellIndex: 14,
            cellPosition: caretPosition,
        });
        const mockSetCaretPosition = jest.fn();
        const mockCell = {
            setCaretPosition: mockSetCaretPosition,
        };
        mockNotebook.getCellByIndex = (cellIndex: number) => {
            expect(cellIndex).toBe(14);
            return mockCell;
        };

        await service.applyChanges(makeMockChange());
        await service.movePrevious();

        expect(mockSelect).toBeCalledTimes(1);
        expect(mockSetCaretPosition).toBeCalledTimes(1);
        expect(mockSetCaretPosition).toBeCalledWith(caretPosition);
    });

    test("redoing a change can set notebook to modified state", async () => {

        mockNotebook.isModified = true;

        await service.applyChanges(makeMockChange());
        await service.movePrevious();

        mockSetModified.mockClear();

        await service.moveNext();

        expect(mockSetModified).toBeCalledTimes(1);
        expect(mockSetModified).toBeCalledWith(true);
    });
    
    test("redoing a change can clear notebook modified state", async () => {

        mockNotebook.isModified = false;

        await service.applyChanges(makeMockChange());
        await service.movePrevious();

        mockMakeUnmodified.mockClear();
        
        await service.moveNext();

        expect(mockMakeUnmodified).toBeCalledTimes(1);
    });

    test("redoing a change can set caret position", async () => {

        mockNotebook.isModified = true;

        const caretPosition: IEditorCaretPosition = {
            lineNumber: 5,
            column: 3,
        };
        mockNotebook.getCaretPosition = () => ({
            cellIndex: 18,
            cellPosition: caretPosition,
        });

        await service.applyChanges(makeMockChange());

        const mockCell1 = {
            setCaretPosition: () => {},
        };
        mockNotebook.getCellByIndex = () => {
            return mockCell1;
        };
        
        await service.movePrevious();

        const mockSetCaretPosition = jest.fn();
        const mockCell2 = {
            setCaretPosition: mockSetCaretPosition,
        };
        mockNotebook.getCellByIndex = (cellIndex: number) => {
            expect(cellIndex).toBe(18);
            return mockCell2;
        };

        mockSelect.mockClear();

        await service.moveNext();

        expect(mockSelect).toBeCalledTimes(1);
        expect(mockSetCaretPosition).toBeCalledTimes(1);
        expect(mockSetCaretPosition).toBeCalledWith(caretPosition);
    });
});
