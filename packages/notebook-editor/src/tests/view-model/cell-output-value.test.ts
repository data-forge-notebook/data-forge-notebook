import { CellOutputValueViewModel } from "../../view-model/cell-output-value";
import { expectEventRaised } from "../lib/utils";

describe("view-model / cell-output-value", () => {

    test("can construct", () => {

        const displayType = "display-type";
        const plugin = "something";
        const data = {};
        const mockModel: any = {
            getDisplayType: () => displayType,
            getData: () => data,
        };
        const cellOutput = new CellOutputValueViewModel(displayType, plugin, data);
        expect(cellOutput.getDisplayType()).toEqual(displayType);
        expect(cellOutput.getPlugin()).toEqual(plugin);
        expect(cellOutput.getData()).toBe(data);
    });
});