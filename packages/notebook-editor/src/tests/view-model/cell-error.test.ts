import { CellErrorViewModel } from "../../view-model/cell-error";

describe("view-model / cell-error", () => {

    test("can construct", () => {

        const instanceId = "1234"
        const msg = "ABCD";
        const mockModel: any = {
            getInstanceId: () => instanceId,
            getMsg: () => msg,
        };
        const cellError = new CellErrorViewModel(mockModel);
        expect(cellError.getInstanceId()).toEqual(instanceId);
        expect(cellError.getMsg()).toEqual(msg);

    });

    test("new cell error is fresh", () => {
        
        const mockModel: any = {};
        const cellError = new CellErrorViewModel(mockModel);
        expect(cellError.isFresh()).toBe(true);
    });

    test("can mark cell error as stale", () => {

        const mockModel: any = {};
        const cellError = new CellErrorViewModel(mockModel);

        cellError.markStale();
        expect(cellError.isFresh()).toBe(false);
    });
});