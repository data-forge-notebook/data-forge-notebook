import moment from "moment";
import { Cell, CellScope, CellType } from "../../model/cell";
import { ISerializedCellOutput1 } from "../../model/serialization/serialized1";

describe("model / cell", () => {

    test("can construct", () => {

        const theId = "1234";
        const theCellType = CellType.Code;
        const theCellScope = CellScope.Global;
        const theText = "const x = 3;";
        const cell = new Cell(theId, theCellType, theCellScope, theText, undefined, undefined, [], []);
        expect(cell.getId()).toEqual(theId);
        expect(cell.getCellType()).toEqual(theCellType);
        expect(cell.getCellScope()).toEqual(theCellScope);
        expect(cell.getText()).toEqual(theText);
    });

    test("can construct with last eval date", () => {

        const theLastEvaluationDate = moment().toISOString(true);
        const cell = new Cell("", CellType.Code, CellScope.Global, "", theLastEvaluationDate, undefined, [], []);
        expect(moment(cell.getLastEvaluationDate()).toISOString(true)).toEqual(theLastEvaluationDate);
    });

    test("can construct with height", () => {

        const theHeight = 18;
        const cell = new Cell("", CellType.Code, CellScope.Global, "", undefined, theHeight, [], []);
        expect(cell.getHeight()).toEqual(theHeight);
    });

    test("setting the text to the same makes no change", () => {

        const cell = new Cell("", CellType.Code, CellScope.Global, "hello", undefined, undefined, [], []);

        expect(cell.setText("hello")).toBe(false);
    });

    test("setting the text to the different changes the text", () => {

        const cell = new Cell("", CellType.Code, CellScope.Global, "hello", undefined, undefined, [], []);

        const newText = "world";
        expect(cell.setText(newText)).toBe(true);
        expect(cell.getText()).toBe(newText);
    });

    test("setting the text trims whitespace from the end", () => {

        const cell = new Cell("", CellType.Code, CellScope.Global, "", undefined, undefined, [], []);

        const baseText = "Hello world";
        expect(cell.setText(`${baseText} `)).toBe(true);
        expect(cell.getText()).toEqual(baseText);
    });

    test("can add outputs", () => {

        const cell = new Cell("", CellType.Code, CellScope.Global, "", undefined, undefined, [], []);
        
        const mockOutput1: any = {};
        const mockOutput2: any = {};
        cell.addOutput(mockOutput1);
        cell.addOutput(mockOutput2);
        expect(cell.getOutput()).toEqual([ mockOutput1, mockOutput2 ]);
    });

    test("can clear outputs", () => {
        const cell = new Cell("", CellType.Code, CellScope.Global, "", undefined, undefined, [], []);
        
        const mockOutput: any = {};
        cell.addOutput(mockOutput);
        cell.clearOutputs();
        expect(cell.getOutput()).toEqual([]);
    });

    test("can overwrite stale outputs", () => {

        const cell = new Cell("", CellType.Code, CellScope.Global, "", undefined, undefined, [], []);
        
        const mockOutput1: any = {
            markStale: () => {},
            isFresh: () => false,
        };
        const mockOutput2: any = {
            markStale: () => {},
            isFresh: () => false,
        };
        cell.addOutput(mockOutput1);
        cell.addOutput(mockOutput2);

        cell.resetOutputs();

        const freshOutput: any = {
            isFresh: () => true,
        };
        cell.addOutput(freshOutput);

        expect(cell.getOutput()).toEqual([ freshOutput, mockOutput2 ]);
    });

    test("can clear stale outputs", () => {

        const cell = new Cell("", CellType.Code, CellScope.Global, "", undefined, undefined, [], []);
        
        const mockOutput1: any = {
            markStale: () => {},
            isFresh: () => false,
        };
        const mockOutput2: any = {
            markStale: () => {},
            isFresh: () => false,
        };
        cell.addOutput(mockOutput1);
        cell.addOutput(mockOutput2);

        cell.resetOutputs();

        const freshOutput: any = {
            isFresh: () => true,
        };
        cell.addOutput(freshOutput);
        cell.clearStaleOutputs();

        expect(cell.getOutput()).toEqual([ freshOutput ]);
    });

    test("can add errors", () => {

        const cell = new Cell("", CellType.Code, CellScope.Global, "", undefined, undefined, [], []);
        
        const mockError1: any = {};
        const mockError2: any = {};
        cell.addError(mockError1);
        cell.addError(mockError2);
        expect(cell.getErrors()).toEqual([ mockError1, mockError2 ]);
    });

    test("can clear errors", () => {
        const cell = new Cell("", CellType.Code, CellScope.Global, "", undefined, undefined, [], []);
        
        const mockError: any = {};
        cell.addError(mockError);
        cell.clearErrors();
        expect(cell.getErrors()).toEqual([]);
    });

    test("can overwrite stale errors", ()=> {

        const cell = new Cell("", CellType.Code, CellScope.Global, "", undefined, undefined, [], []);
        
        const mockError1: any = {
            markStale: () => {},
            isFresh: () => false,
        };
        const mockError2: any = {
            markStale: () => {},
            isFresh: () => false,
        };
        cell.addError(mockError1);
        cell.addError(mockError2);

        cell.resetErrors();

        const freshError: any = {
            isFresh: () => true,
        };
        cell.addError(freshError);

        expect(cell.getErrors()).toEqual([ freshError, mockError2 ]);
    });

    test("can clear stale errors", () => {

        const cell = new Cell("", CellType.Code, CellScope.Global, "", undefined, undefined, [], []);
        
        const mockError1: any = {
            markStale: () => {},
            isFresh: () => false,
        };
        const mockError2: any = {
            markStale: () => {},
            isFresh: () => false,
        };
        cell.addError(mockError1);
        cell.addError(mockError2);

        cell.resetErrors();

        const freshError: any = {
            isFresh: () => true,
        };
        cell.addError(freshError);
        cell.clearStaleErrors();

        expect(cell.getErrors()).toEqual([ freshError ]);
    });

    test("can serialize code cell", () => {
        const theId = "1234";
        const theCellScope = CellScope.Global;
        const theText = "const x = 3;";
        const theLastEvaluationDate = moment().toISOString(true);
        const theHeight = 18;
        const cell = new Cell(theId, CellType.Code, theCellScope, theText, theLastEvaluationDate, theHeight, [], []);
        expect(cell.serialize()).toEqual({
            id: theId,
            cellType: CellType.Code,
            cellScope: theCellScope,
            code: theText,
            lastEvaluationDate: theLastEvaluationDate,
            output: [],
            errors: [],
            height: theHeight,
        });        
    });

    test("can serialize cell with output and errors", () => {
        const serializedOutput: any = {};
        const mockOutput: any = {
            serialize: () => serializedOutput,
        };
        const serializedError: any = {};
        const mockError: any = {
            serialize: () => serializedError,
        };
        const cell = new Cell("1234", CellType.Code, CellScope.Global, "", undefined, undefined, [ mockOutput ], [ mockError ]);
        const serialized = cell.serialize();
        expect(serialized.output).toEqual([ serializedOutput ]);
        expect(serialized.errors).toEqual([ serializedError ]);
    });

    test("can serialize markdown cell", () => {
        const theId = "1234";
        const theText = "# Hello markdown;";
        const cell = new Cell(theId, CellType.Markdown, undefined, theText, undefined, undefined, [], []);
        expect(cell.serialize()).toEqual({
            id: theId,
            cellType: CellType.Markdown,
            code: theText,
            output: [],
            errors: [],
        });        
    });

    test("can deserialize markdown cell", () => {

        const theId = "1234";
        const theText = "# Hello markdown;";
        const cell = Cell.deserialize({
            id: theId,
            cellType: CellType.Markdown,
            code: theText,
        });
        expect(cell.getId()).toEqual(theId);
        expect(cell.getText()).toEqual(theText);
        expect(cell.getCellType()).toEqual(CellType.Markdown);
    });

    test("can deserialize code cell", () => {

        const theId = "1234";
        const theText = "const x = 1;";
        const cell = Cell.deserialize({
            id: theId,
            cellType: CellType.Code,
            cellScope: CellScope.Global,
            code: theText,
        });
        expect(cell.getId()).toEqual(theId);
        expect(cell.getText()).toEqual(theText);
        expect(cell.getCellType()).toEqual(CellType.Code);
        expect(cell.getCellScope()).toEqual(CellScope.Global);
        expect(cell.getOutput()).toEqual([]);
        expect(cell.getErrors()).toEqual([]);
    });

    test("can deserialize cell with height", () => {

        const theHeight = 13;
        const cell = Cell.deserialize({
            id: "1234",
            cellType: CellType.Code,
            code: "",
            height: theHeight,
        });
        expect(cell.getHeight()).toEqual(theHeight);
   });

   test("can deserialize cell with evaluation date", () => {

        const theLastEvaluationDate = moment().toISOString(true);
        const cell = Cell.deserialize({
            id: "1234",
            cellType: CellType.Code,
            code: "",
            lastEvaluationDate: theLastEvaluationDate,
        });
        expect(moment(cell.getLastEvaluationDate()).toISOString(true)).toEqual(theLastEvaluationDate);
    });

    test("can deserialize code cell with output", () => {

        const serializedOutputValue: any = {};
        const serializedOutput: any = {
            value: serializedOutputValue,
        };
        const cell = Cell.deserialize({
            id: "1234",
            cellType: CellType.Code,
            code: "",
            output: [
                serializedOutput,
            ]
        });

        expect(cell.getOutput().length).toEqual(1);
        expect(cell.getOutput()[0]).toBeDefined();
    });

    test("can deserialize code cell with error", () => {

        const serializedError: any = {};
        const cell = Cell.deserialize({
            id: "1234",
            cellType: CellType.Code,
            code: "",
            errors: [
                serializedError,
            ]
        });

        expect(cell.getErrors().length).toEqual(1);
        expect(cell.getErrors()[0]).toBeDefined();
    });

    test("can set cell scope", () => {
        const cell = new Cell("", CellType.Code, CellScope.Global, "", undefined, undefined, [], []);
        
        const theScope = CellScope.Local;
        expect(cell.getCellScope()).not.toBe(theScope);

        cell.setCellScope(theScope);
        expect(cell.getCellScope()).toBe(theScope);
    });

    test("can set last eval date", () => {
        const cell = new Cell("", CellType.Code, CellScope.Global, "", undefined, undefined, [], []);
        
        expect(cell.getLastEvaluationDate()).toBeUndefined();

        const theLastEvaluationDate = moment().toDate();
        cell.setLastEvaluationDate(theLastEvaluationDate);
        expect(cell.getLastEvaluationDate()).toEqual(theLastEvaluationDate);
    });

    test("can set height", () => {
        const cell = new Cell("", CellType.Code, CellScope.Global, "", undefined, undefined, [], []);
        
        expect(cell.getHeight()).toBeUndefined();

        const theHeight = 22;
        cell.setHeight(theHeight);
        expect(cell.getHeight()).toBe(theHeight);
    });
});