import { CellOutput } from "../../model/cell-output";
import { CellOutputValue } from "../../model/cell-output-value";

describe("model / cell-output", () => {

    test("can construct", () => {

        const mockValue: any = {};        
        const cellOutput = new CellOutput(mockValue, undefined);
        expect(cellOutput.getInstanceId()).toBeDefined();
        expect(cellOutput.getValue()).toBe(mockValue);
        expect(cellOutput.getHeight()).toBe(undefined);
    });

    test("can construct with height", () => {

        const mockValue: any = {};        
        const theHeight = 15;
        const cellOutput = new CellOutput(mockValue, theHeight);
        expect(cellOutput.getHeight()).toBe(theHeight);
    });

    test("can serialize", () => {
        const mockSerializedValue: any = { id: "1234" };
        const mockValue: any = { 
            serialize: () => mockSerializedValue,
        };        
        const theHeight = 15;
        const cellOutput = new CellOutput(mockValue, theHeight);
        const serialized = cellOutput.serialize();
        expect(serialized).toEqual({
            value: mockSerializedValue,
            height: theHeight,
        });
    });

    test("can mark stale", () => {

        const cellOutput = new CellOutput({} as any, undefined);
        expect(cellOutput.isFresh()).toEqual(true);

        cellOutput.markStale();
        expect(cellOutput.isFresh()).toEqual(false);
    });

    test("can set height", () => {

        const cellOutput = new CellOutput({} as any, undefined);
        expect(cellOutput.getHeight()).toBeUndefined();

        const theHeight = 12;
        cellOutput.setHeight(theHeight);
        expect(cellOutput.getHeight()).toBe(theHeight);
    });
});