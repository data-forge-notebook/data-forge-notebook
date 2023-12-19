import { CellOutputValueViewModel } from "../../view-model/cell-output-value";
import { deserializeCellOutputValue } from "../../serialization/json/deserialize";
import { serializeCellOutputValue } from "../../serialization/json/serialize";

describe("view-model / cell-output-value", () => {

    test("can construct", () => {

        const theDisplayType = "string";
        const theData = "hello";
        const thePlugin = "a-plugin";
        const cellOutputValue = new CellOutputValueViewModel(theDisplayType, thePlugin, theData);
        expect(cellOutputValue.displayType).toEqual(theDisplayType);
        expect(cellOutputValue.data).toEqual(theData);
        expect(cellOutputValue.plugin).toEqual(thePlugin)
    });

    test("can serialize", () => {

        const theDisplayType = "string";
        const theData = "hello";
        const cellOutputValue = new CellOutputValueViewModel(theDisplayType, undefined, theData);
        expect(serializeCellOutputValue(cellOutputValue)).toEqual({
            displayType: theDisplayType,
            data: theData,
        });
    });

    test("can deserialize", () => {

        const theDisplayType = "string";
        const theData = "hello";
        const cellOutputValue = deserializeCellOutputValue({
            displayType: theDisplayType,
            data: theData,
        });
        expect(cellOutputValue.displayType).toEqual(theDisplayType);
        expect(cellOutputValue.data).toEqual(theData);
    });    
    
});