import { CellOutputViewModel } from "../../view-model/cell-output";
import { CellOutputValueViewModel } from "../../view-model/cell-output-value";
import { expectEventRaised } from "../lib/utils";

describe("view-model / cell-output", () => {

    test("can construct", () => {

        const instanceId = "1234";
        const value = {};
        const serialized = {};
        const mockModel: any = {
            getInstanceId: () => instanceId,
            getValue: () => value,
            serialize: () => serialized,            
        };
        const cellOutput = new CellOutputViewModel(mockModel);
        expect(cellOutput.getInstanceId()).toEqual(instanceId);
        expect(cellOutput.getValue()).toBeInstanceOf(CellOutputValueViewModel);
        expect(cellOutput.serialize()).toBe(serialized);
    });

    test("new cell output is fresh", () => {
        
        const mockModel: any = { getValue: () => {} };
        const cellOutput = new CellOutputViewModel(mockModel);
        expect(cellOutput.isFresh()).toBe(true);
    });


    test("can mark cell output as stale", () => {

        const mockModel: any = { getValue: () => {} };
        const cellOutput = new CellOutputViewModel(mockModel);

        cellOutput.markStale();
        expect(cellOutput.isFresh()).toBe(false);
    });

    test("getting the height returns model height", () => {
        const mockModel: any = { 
            getValue: () => {}, 
            getHeight: () => 13,
        };
        const cellOutput = new CellOutputViewModel(mockModel);
        expect(cellOutput.getHeight()).toEqual(13);
    });

    test("setting the height sets the model height", async () => {
        let heightWasSet = false;
        const mockModel: any = { 
            getValue: () => {}, 
            setHeight: async () => {
                heightWasSet = true;
            },
        };
        const cellOutput = new CellOutputViewModel(mockModel);
        await cellOutput.setHeight(22);
        expect(heightWasSet).toBe(true);
    });

    test("setting the height raises the onModified event", async () => {
        const mockModel: any = { 
            getValue: () => {}, 
            setHeight: async () => {},
        };
        const cellOutput = new CellOutputViewModel(mockModel);
        await expectEventRaised(cellOutput, "onModified", async () => {
            await cellOutput.setHeight(22);
        });
    });

    test("notify resize is forwarded to value view-model", async () => {
        const mockModel: any = { 
            getValue: () => {}, 
        };
        const cellOutput = new CellOutputViewModel(mockModel);
        await expectEventRaised(cellOutput.getValue(), "onResized", async () => {
            await cellOutput.notifyResized();
        });
    });
});