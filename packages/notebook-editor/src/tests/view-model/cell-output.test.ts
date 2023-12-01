import { CellOutputViewModel } from "../../view-model/cell-output";
import { CellOutputValueViewModel } from "../../view-model/cell-output-value";
import { expectEventRaised } from "../lib/utils";

describe("view-model / cell-output", () => {

    test("can construct", () => {
        const value: any = {};
        const cellOutput = new CellOutputViewModel(value);
        expect(cellOutput.getValue()).toBeInstanceOf(CellOutputValueViewModel);
    });

    test("can serialize", () => {
        const value: any = {};
        const height = 33;
        const cellOutput = new CellOutputViewModel(value, height);
        expect(cellOutput.serialize()).toEqual({});
    });

    test("new cell output is fresh", () => {        
        const value: any = {};
        const cellOutput = new CellOutputViewModel(value);
        expect(cellOutput.isFresh()).toBe(true);
    });

    test("can mark cell output as stale", () => {
        const value: any = {};
        const cellOutput = new CellOutputViewModel(value);

        cellOutput.markStale();
        
        expect(cellOutput.isFresh()).toBe(false);
    });

    test("setting the height raises the onModified event", async () => {
        const value: any = {};
        const cellOutput = new CellOutputViewModel(value);
        await expectEventRaised(cellOutput, "onModified", async () => {
            await cellOutput.setHeight(22);
        });
    });
});