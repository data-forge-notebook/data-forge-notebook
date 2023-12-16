import { CellErrorViewModel } from "../../view-model/cell-error";
import { serializeError } from "../../view-model/serialize";

describe("view-model / cell-error", () => {

    test("can construct", () => {
        const msg = "ABCD";
        const cellError = new CellErrorViewModel(msg);
        expect(cellError.instanceId).toBeDefined();
        expect(cellError.msg).toEqual(msg);

    });

    test("new cell error is fresh", () => {
        const cellError = new CellErrorViewModel("");
        expect(cellError.fresh).toBe(true);
    });

    test("can mark cell error as stale", () => {
        const cellError = new CellErrorViewModel("");

        cellError.markStale();
        expect(cellError.fresh).toBe(false);
    });

    test("can serialize", () => {
        const theMessage = "An error";
        const cellError = new CellErrorViewModel(theMessage);
        expect(serializeError(cellError)).toEqual({
            msg: theMessage,
        });
    });

    test("can deserialize", () => {
        const theMessage = "An error";
        const cellError = CellErrorViewModel.deserialize({
            msg: theMessage,
        });
        expect(cellError.msg).toEqual(theMessage);
    });

    test("can mark stale", () => {
        const cellError = new CellErrorViewModel("");
        expect(cellError.fresh).toEqual(true);

        cellError.markStale();
        expect(cellError.fresh).toEqual(false);
    });    
});