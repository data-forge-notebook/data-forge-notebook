import { CellOutputViewModel } from "../../view-model/cell-output";
import { CellOutputValueViewModel } from "../../view-model/cell-output-value";
import { expectEventRaised } from "../lib/utils";

describe("view-model / cell-output", () => {

    test("can construct", () => {
        const mockValue: any = {};        
        const cellOutput = new CellOutputViewModel(mockValue, undefined);
        expect(cellOutput.instanceId).toBeDefined();
        expect(cellOutput.value).toBe(mockValue);
        expect(cellOutput.height).toBe(undefined);
    });

    test("can construct with height", () => {
        const mockValue: any = {};        
        const theHeight = 15;
        const cellOutput = new CellOutputViewModel(mockValue, theHeight);
        expect(cellOutput.height).toBe(theHeight);
    });

    test("can serialize", () => {
        const mockSerializedValue: any = { id: "1234" };
        const mockValue: any = { 
            serialize: () => mockSerializedValue,
        };        
        const theHeight = 15;
        const cellOutput = new CellOutputViewModel(mockValue, theHeight);
        const serialized = cellOutput.serialize();
        expect(serialized).toEqual({
            value: mockSerializedValue,
            height: theHeight,
        });
    });

    test("new cell output is fresh", () => {        
        const value: any = {};
        const cellOutput = new CellOutputViewModel(value);
        expect(cellOutput.fresh).toBe(true);
    });

    test("can mark stale", () => {
        const cellOutput = new CellOutputViewModel({} as any, undefined);

        cellOutput.markStale();
        expect(cellOutput.fresh).toEqual(false);
    });

});