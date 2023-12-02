import { CellOutputValueViewModel } from "../../view-model/cell-output-value";

describe("view-model / cell-output-value", () => {

    test("can construct", () => {

        const theDisplayType = "string";
        const theData = "hello";
        const thePlugin = "a-plugin";
        const cellOutputValue = new CellOutputValueViewModel(theDisplayType, thePlugin, theData);
        expect(cellOutputValue.getDisplayType()).toEqual(theDisplayType);
        expect(cellOutputValue.getData()).toEqual(theData);
        expect(cellOutputValue.getPlugin()).toEqual(thePlugin)
    });

    test("can serialize", () => {

        const theDisplayType = "string";
        const theData = "hello";
        const cellOutputValue = new CellOutputValueViewModel(theDisplayType, undefined, theData);
        expect(cellOutputValue.serialize()).toEqual({
            displayType: theDisplayType,
            data: theData,
        });
    });

    test("can deserialize", () => {

        const theDisplayType = "string";
        const theData = "hello";
        const cellOutputValue = CellOutputValueViewModel.deserialize({
            displayType: theDisplayType,
            data: theData,
        });
        expect(cellOutputValue.getDisplayType()).toEqual(theDisplayType);
        expect(cellOutputValue.getData()).toEqual(theData);
    });    
    
});