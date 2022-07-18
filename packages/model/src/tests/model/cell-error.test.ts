import { CellError } from "../../model/cell-error";

describe("model / cell-error", () => {

    test("can construct", () => {

        const theMessage = "An error";
        const cellError = new CellError(theMessage);
        expect(cellError.getMsg()).toEqual(theMessage);
    });

    test("can get instance id", () => {

        const cellError = new CellError("");
        expect(cellError.getInstanceId().length).toBeGreaterThan(0);
    });

    test("can serialize", () => {

        const theMessage = "An error";
        const cellError = new CellError(theMessage);
        expect(cellError.serialize()).toEqual({
            msg: theMessage,
        });
    });

    test("can deserialize", () => {

        const theMessage = "An error";
        const cellError = CellError.deserialize({
            msg: theMessage,
        });
        expect(cellError.getMsg()).toEqual(theMessage);
    });

    test("can mark stale", () => {

        const cellError = new CellError("");
        expect(cellError.isFresh()).toEqual(true);

        cellError.markStale();
        expect(cellError.isFresh()).toEqual(false);
    });

});