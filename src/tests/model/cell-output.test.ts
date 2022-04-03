import { CellOutput } from "../../model/cell-output";
import { CellOutputValue } from "../../model/cell-output-value";

describe("model / cell-output", () => {

    test("can construct", () => {

        const mockValue: any = {};        
        const cellOutput = new CellOutput(mockValue, undefined);
        expect(cellOutput.getValue()).toBe(mockValue);
        expect(cellOutput.getHeight()).toBe(undefined);
    });

    test("can construct with height", () => {

        const mockValue: any = {};        
        const theHeight = 15;
        const cellOutput = new CellOutput(mockValue, theHeight);
        expect(cellOutput.getHeight()).toBe(theHeight);
    });

});