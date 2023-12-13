import { CellTextChange } from "../../changes/cell-text-change";

describe('services / undoredo / cell-text-change', () => {

    let mockSetText: jest.Mock<any, any>;
    let mockCell: any;
    const oldCellText = "old-cell-text";

    beforeEach(() => {
        mockSetText = jest.fn();
        mockCell = {
            text: oldCellText,
            setText: mockSetText,
        };
    });

    test("can do change to cell text", async () => {
        const newCellText = "some-new-text";
        const change = new CellTextChange(mockCell, newCellText);
        await change.do();

        expect(mockSetText).toBeCalledTimes(1);
        expect(mockSetText.mock.calls[0][0]).toEqual(newCellText);
    });

    test("can undo change to cell text", async () => {
        const newCellText = "some-new-text";
        const change = new CellTextChange(mockCell, newCellText);
        await change.do();
        await change.undo();

        expect(mockSetText).toBeCalledTimes(2);
        expect(mockSetText.mock.calls[1][0]).toEqual(oldCellText);
    });

    test("can undo change to cell text when original text was empty", async () => {
        mockCell.text = ""; // No code in this cell yet.
        const newCellText = "some-new-text";
        const change = new CellTextChange(mockCell, newCellText);
        await change.do();
        await change.undo();

        expect(mockSetText).toBeCalledTimes(2);
        expect(mockSetText.mock.calls[1][0]).toEqual("");
    });
    
    test("can undo then redo change to cell text", async () => {
        const newCellText = "some-new-text";
        const change = new CellTextChange(mockCell, newCellText);
        await change.do();
        await change.undo();
        await change.do();

        expect(mockSetText).toBeCalledTimes(3);
        expect(mockSetText.mock.calls[2][0]).toEqual(newCellText);
    });
});
