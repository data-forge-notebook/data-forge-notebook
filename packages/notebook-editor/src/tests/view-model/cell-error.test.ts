import { CellErrorViewModel } from "../../view-model/cell-error";

describe("view-model / cell-error", () => {

    test("can construct", () => {
        const msg = "ABCD";
        const cellError = new CellErrorViewModel(msg);
        expect(cellError.getInstanceId()).toBeDefined();
        expect(cellError.getMsg()).toEqual(msg);

    });

    test("new cell error is fresh", () => {
        const cellError = new CellErrorViewModel("");
        expect(cellError.isFresh()).toBe(true);
    });

    test("can mark cell error as stale", () => {
        const cellError = new CellErrorViewModel("");

        cellError.markStale();
        expect(cellError.isFresh()).toBe(false);
    });

    test("can serialize", () => {
        const theMessage = "An error";
        const cellError = new CellErrorViewModel(theMessage);
        expect(cellError.serialize()).toEqual({
            msg: theMessage,
        });
    });

    test("can deserialize", () => {
        const theMessage = "An error";
        const cellError = CellErrorViewModel.deserialize({
            msg: theMessage,
        });
        expect(cellError.getMsg()).toEqual(theMessage);
    });

    test("can mark stale", () => {
        const cellError = new CellErrorViewModel("");
        expect(cellError.isFresh()).toEqual(true);

        cellError.markStale();
        expect(cellError.isFresh()).toEqual(false);
    });    
});