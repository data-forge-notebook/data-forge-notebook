//
// Format a value for display.
//
import * as Sugar from 'sugar';
import { ISerializedCellOutputValue1 } from 'model';

//
// Convert key/value pairs to a JavaScript object.
//
export function toObject(keys: string[], values: any[]): any {
    const output: any = {};
    for (let i = 0; i < keys.length; ++i) {
        output[keys[i]] = values[i];
    }    
    return output;
}

//
// Convert a cell output value to a data structure that can either be serialized to disk or formatted for display.
//
export function convertDisplayValue(value: any, hint?: string): ISerializedCellOutputValue1 {

    const typeCode = value && value.getTypeCode && value.getTypeCode();
    const typeName = typeof(value);

    if (typeCode === "series") { // Should support a toDisplay() function!
        if (hint === "table") {
            return {
                displayType: "table",
                data: {
                    rows: value.toArray().map((value: any) => ({
                        value: value,
                    })),
                    columnNames: ["value"],
                }
            };
        }
        else {
            return {
                displayType: "array",
                data: value.toArray(),
            };
        }
    }

    if (typeCode === "dataframe") { // Should support a toDisplay() function!
        return {
            displayType: "table",
            data: {
                rows: value.toArray(),
                columnNames: value.getColumnNames(),
            }
        };
    }

    if (Sugar.Object.isArray(value) && hint === "table") {
        let rows = value as any[];
        let columnNames: string[] = [];
        if (value.length > 0) {
            const firstValue = value[0];
            if (Sugar.Object.isArray(firstValue)) {
                columnNames = firstValue; // Use header as column names.
                rows.shift(); // Remove header.
                rows = rows.map(row => toObject(columnNames, row));
            }
            else if (Sugar.Object.isObject(firstValue)) {
                columnNames = Object.keys(firstValue); // Extract column names from fields.
            }
            else {
                columnNames = [ "value" ];
                rows = rows.map((value: any) => ({ value: value }));
            }
        }

        return {
            displayType: "table",
            data: {
                rows: rows,
                columnNames: columnNames,
            },
        };
    }

    if (typeName === "object" && hint === "table") {
        return {
            displayType: "table",
            data: {
                columnNames: ["Property", "Value"],
                rows: Object.keys(value)
                    .map(key => {
                        return {
                            Property: key,
                            Value: value[key]
                        };
                    })
            },
        };
    }

    if (typeCode === "plot") {  //TODO: Old format. Deprecated. Remove at version 2.
        return {
            displayType: "chart",
            data: value.serialize(),
        };
    }

    if (typeCode === "plotex") {  // New format.
        return {
            displayType: "plot",
            data: value.serialize(),
        };
    }

    if (Sugar.Object.isArray(value)) {
        return {
            displayType: "array",
            data: value,
        };
    }

    if (typeName === "object") {
        return {
            displayType: "object",
            data: value,
        };
    }

    if (value === undefined) {
        return {
            displayType: "string",
            data: "undefined",
        };
    }

    if (value === null) {
        return {
            displayType: "string",
            data: "null",
        };
    }

    return {
        displayType: "string",
        data: value.toString(),
    };
}

