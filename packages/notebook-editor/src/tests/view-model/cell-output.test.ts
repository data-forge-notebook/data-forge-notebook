import { CellOutputViewModel } from "../../view-model/cell-output";
import { serializeCell, serializeCellOutput } from "../../view-model/serialize";

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
        const mockValue: any = {
            displayType: "displayType",
            plugin: "plugin",
            data: "data",
        };
        const theHeight = 15;
        const cellOutput = new CellOutputViewModel(mockValue, theHeight);
        const serialized = serializeCellOutput(cellOutput);
        expect(serialized).toEqual({
            value: {
                displayType: "displayType",
                plugin: "plugin",
                data: "data",
            },
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