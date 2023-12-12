import { disableInjector } from "@codecapers/fusion";
import { CellType } from "model";
import { ICellErrorViewModel } from "../../view-model/cell-error";
import { ICellOutputViewModel } from "../../view-model/cell-output";
import { CodeCellViewModel } from "../../view-model/code-cell";
import moment from "moment";

describe("view-model / code-cell", () => {
    
    beforeAll(() => {
        disableInjector();
    });

    //
    // Creates a cell for testing.
    //
    function createCell() {
        const cell = new CodeCellViewModel("", CellType.Code, "", undefined, [], []);
        return { cell };
    }

    //
    // Creates a mock output that can be added to a cell.
    //
    function createMockCellOutput(fields?: any) {
        const mockCellOutputViewModel: any = {
            markStale: jest.fn(),
            getHeight: () => undefined,
            setHeight: jest.fn(),
            ...fields,
        };
        return { mockCellOutputViewModel };
    }   

    //
    // Creates a mock error that can be added to a cell.
    //
    function createMockCellError(fields?: any) {
        const mockCellErrorModel: any = {};
        const mockCellErrorViewModel: any = {
            getModel: () => mockCellErrorModel,
            markStale: jest.fn(),
            ...fields,
        };
        return { mockCellErrorViewModel, mockCellErrorModel };
    }   

    //
    // Creates a cell with one mock output.
    //
    async function createCellWithOutput() {
        const { cell } = createCell();

        const { mockCellOutputViewModel } = createMockCellOutput();
        await cell.addOutput(mockCellOutputViewModel);

        return { cell, mockCellOutputViewModel };
    }

    //
    // Creates a cell with one mock error.
    //
    async function createCellWithError() {
        const { cell } = createCell();

        const { mockCellErrorViewModel, mockCellErrorModel } = createMockCellError();
        await cell.addError(mockCellErrorViewModel);

        return { cell, mockCellErrorViewModel, mockCellErrorModel };
    }

    test("can construct", () => {

        const now = new Date();
        const output: ICellOutputViewModel[] = [];
        const errors: ICellErrorViewModel[] = [];
        const cell = new CodeCellViewModel("test-id", CellType.Code, "some-code", now, output, errors);
        expect(cell.id).toBe("test-id");
        expect(cell.cellType).toBe(CellType.Code);
        expect(cell.text).toBe("some-code");
        expect(cell.lastEvaluationDate).toBe(now);
        expect(cell.output.length).toBe(0);
        expect(cell.errors.length).toBe(0);
    });

    test("can add an output", async () => {

        const cell = new CodeCellViewModel("", CellType.Code, "", undefined, [], []);

        const { mockCellOutputViewModel } = createMockCellOutput({ instanceId: "new-output" });
        await cell.addOutput(mockCellOutputViewModel);

        expect(cell.output.length).toEqual(1);
        expect(cell.output[0].instanceId).toBe("new-output");
    });
    
    test("can clear outputs", async () => {

        const { cell } = await createCellWithOutput();

        await cell.clearOutputs();

        expect(cell.output).toEqual([]);
    });
    
    test("can overwrite stale outputs", async () => {

        const { cell } = createCell();

        const { mockCellOutputViewModel: mockOutput1 } = createMockCellOutput({ instanceId: "old-output-1", fresh: false });
        await cell.addOutput(mockOutput1);

        const { mockCellOutputViewModel: mockOutput2 } = createMockCellOutput({ instanceId: "old-output-2", fresh: false });
        await cell.addOutput(mockOutput2);

        cell.resetOutputs(); // Resets the output index to 0, causing the new output to overwrite the first existing output.

        expect(mockOutput1.markStale).toHaveBeenCalled();
        expect(mockOutput2.markStale).toHaveBeenCalled();

        // Add a fresh output.
        const { mockCellOutputViewModel: mockFreshOutput } = createMockCellOutput({ instanceId: "fresh-output", fresh: true });
        await cell.addOutput(mockFreshOutput);

        expect(cell.output.length).toEqual(2);
        expect(cell.output[0].instanceId).toEqual("fresh-output");
        expect(cell.output[1].instanceId).toEqual("old-output-2");
    });

    test("height is replicated to fresh output when display type is the same", async () => {

        const { cell } = createCell();

        const { mockCellOutputViewModel: mockOutput } = createMockCellOutput({ 
            height: 42, 
            value: {
                displayType: "chart",
            }
        });
        await cell.addOutput(mockOutput);

        cell.resetOutputs(); // Sets output index to 0 to overwrite the first output.

        // Add a fresh output.
        const { mockCellOutputViewModel: mockFreshOutput } = createMockCellOutput({
            value: {
                displayType: "chart", // Same display type as original.
            },
        });
        await cell.addOutput(mockFreshOutput);

        expect(mockFreshOutput.setHeight).toHaveBeenCalledWith(42);
    });

    test("height is not replicated to fresh output when display type is the same", async () => {

        const { cell } = createCell();

        const { mockCellOutputViewModel: mockOutput } = createMockCellOutput();
        await cell.addOutput(mockOutput);

        const origOutputHeight = 42;
        mockOutput.getHeight = () => origOutputHeight;
        mockOutput.getValue = () => ({
            getDisplayType: () => "chart",
        });

        // Mark existing outputs as stale.
        cell.resetOutputs();

        // Add a fresh output.
        const { mockCellOutputViewModel: mockFreshOutput } = createMockCellOutput();
        mockFreshOutput.getValue = () => ({
            getDisplayType: () => "geo", // Not the same display type as original.
        });

        await cell.addOutput(mockFreshOutput);

        expect(mockFreshOutput.setHeight).not.toHaveBeenCalled();
    });

    test("can clear stale outputs", async () => {

        const { cell } = createCell();

        const { mockCellOutputViewModel: mockOutput1 } = createMockCellOutput({ instanceId: "old-output-1", fresh: false });
        await cell.addOutput(mockOutput1);

        const { mockCellOutputViewModel: mockOutput2 } = createMockCellOutput({ instanceId: "old-output-2", fresh: false });
        await cell.addOutput(mockOutput2);

        // Add a fresh output.
        const { mockCellOutputViewModel: mockFreshOutput } = createMockCellOutput({ instanceId: "fresh-output", fresh: true });
        await cell.addOutput(mockFreshOutput);

        cell.clearStaleOutputs(); // Removes non-fresh outputs.

        expect(cell.output.length).toEqual(1);
        expect(cell.output[0].instanceId).toEqual("fresh-output");
    });

    test("can add an error", async () => {

        const { cell } = createCell();

        const { mockCellErrorViewModel } = createMockCellError({ instanceId: "new-error" });
        await cell.addError(mockCellErrorViewModel);

        expect(cell.errors.length).toEqual(1);
        expect(cell.errors[0].instanceId).toBe("new-error");
    });

    test("can clear errors", async () => {

        const { cell } = await createCellWithError();

        await cell.clearErrors();

        expect(cell.errors.length).toEqual(0);
    });
    
    test("can overwrite stale errors", async () => {

        const { cell } = createCell();

        const { mockCellErrorViewModel: mockError1 } = createMockCellError({ instanceId: "old-error-1", fresh: false });
        await cell.addError(mockError1);

        const { mockCellErrorViewModel: mockError2 } = createMockCellError({ instanceId: "old-error-2", fresh: false });
        await cell.addError(mockError2);

        cell.resetErrors(); // Resets the error index to 0, causing the fresh error to overwrite the first existing error.

        expect(mockError1.markStale).toHaveBeenCalled();
        expect(mockError2.markStale).toHaveBeenCalled();

        // Add a fresh error.
        const { mockCellErrorViewModel: mockFreshError } = createMockCellError({ instanceId: "fresh-error", fresh: true });
        await cell.addError(mockFreshError);

        expect(cell.errors.length).toEqual(2);
        expect(cell.errors[0].instanceId).toEqual("fresh-error");
        expect(cell.errors[1].instanceId).toEqual("old-error-2");
    });

    test("can clear stale errors", async () => {

        const { cell } = createCell();

        const { mockCellErrorViewModel: mockError1 } = createMockCellError({ instanceId: "old-error-1", fresh: false });
        await cell.addError(mockError1);

        const { mockCellErrorViewModel: mockError2 } = createMockCellError({ instanceId: "old-error-2", fresh: false });
        await cell.addError(mockError2);

        // Add a fresh error.
        const { mockCellErrorViewModel: mockFreshError } = createMockCellError({ instanceId: "fresh-error", fresh: true });
        await cell.addError(mockFreshError);

        cell.clearStaleErrors(); // Removes non-fresh errors.

        expect(cell.errors.length).toEqual(1);
        expect(cell.errors[0].instanceId).toEqual("fresh-error");
    });

    test("can serialize code cell", () => {
        const theId = "1234";
        const theText = "const x = 3;";
        const theLastEvaluationDate = moment();
        const cell = new CodeCellViewModel(theId, CellType.Code, theText, theLastEvaluationDate.toDate(), [], []);
        expect(cell.serialize()).toEqual({
            id: theId,
            cellType: CellType.Code,
            code: theText,
            lastEvaluationDate: theLastEvaluationDate.toISOString(true),
            output: [],
            errors: [],
        });        
    });

    test("can serialize cell with output and errors", () => {
        const serializedOutput: any = {};
        const { mockCellOutputViewModel: mockOutput } = createMockCellOutput({ serialize: () => serializedOutput });
        const serializedError: any = {};
        const mockError: any = {
            serialize: () => serializedError,
        };
        const cell = new CodeCellViewModel("1234", CellType.Code, "", undefined, [ mockOutput ], [ mockError ]);
        const serialized = cell.serialize();
        expect(serialized.output).toEqual([ serializedOutput ]);
        expect(serialized.errors).toEqual([ serializedError ]);
    });

    test("can deserialize code cell", () => {

        const theId = "1234";
        const theText = "const x = 1;";
        const cell = CodeCellViewModel.deserialize({
            id: theId,
            cellType: CellType.Code,
            code: theText,
        });
        expect(cell.id).toEqual(theId);
        expect(cell.text).toEqual(theText);
        expect(cell.cellType).toEqual(CellType.Code);
        expect(cell.output).toEqual([]);
        expect(cell.errors).toEqual([]);
        expect(cell.lastEvaluationDate).toBeUndefined();
    });

    test("can deserialize cell with evaluation date", () => {

        const theLastEvaluationDate = moment();
        const cell = CodeCellViewModel.deserialize({
            id: "1234",
            cellType: CellType.Code,
            code: "",
            lastEvaluationDate: theLastEvaluationDate.toISOString(true),
        });
        expect(cell.lastEvaluationDate).toEqual(theLastEvaluationDate.toDate());
    });

    test("can deserialize code cell with output", () => {

        const serializedOutputValue: any = {};
        const serializedOutput: any = {
            value: serializedOutputValue,
        };
        const cell = CodeCellViewModel.deserialize({
            id: "1234",
            cellType: CellType.Code,
            code: "",
            output: [
                serializedOutput,
            ]
        });

        expect(cell.output.length).toEqual(1);
        expect(cell.output[0]).toBeDefined();
    });

    test("can deserialize code cell with error", () => {

        const serializedError: any = {};
        const cell = CodeCellViewModel.deserialize({
            id: "1234",
            cellType: CellType.Code,
            code: "",
            errors: [
                serializedError,
            ]
        });

        expect(cell.errors.length).toEqual(1);
        expect(cell.errors[0]).toBeDefined();
    });
});
