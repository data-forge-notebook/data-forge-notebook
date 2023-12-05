import { disableInjector } from "@codecapers/fusion";
import { CellType } from "model";
import { EventSource, BasicEventHandler } from "utils";
import { ICellErrorViewModel } from "../../view-model/cell-error";
import { ICellOutputViewModel } from "../../view-model/cell-output";
import { CodeCellViewModel } from "../../view-model/code-cell";
import { expectEventNotRaised, expectEventRaised } from "../lib/utils";
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
        const cell = new CodeCellViewModel("", CellType.Code, "", now, output, errors);
        expect(cell.lastEvaluationDate).toBe(now);
        expect(cell.output).toBe(output);
        expect(cell.errors).toBe(errors);
    });

    test("can add an output", async () => {

        const cell = new CodeCellViewModel("", CellType.Code, "", undefined, [], []);

        const { mockCellOutputViewModel } = createMockCellOutput();
        await cell.addOutput(mockCellOutputViewModel);

        expect(cell.output).toEqual([ mockCellOutputViewModel ]);
    });

    test("adding an output raises onOutputChanged", async () => {

        const cell = new CodeCellViewModel("", CellType.Code, "", undefined, [], []);

        await expectEventRaised(cell, "onOutputChanged", async () => {
            const { mockCellOutputViewModel } = createMockCellOutput();
            await cell.addOutput(mockCellOutputViewModel);
        });
    });

    test("can clear outputs", async () => {

        const { cell } = await createCellWithOutput();

        await cell.clearOutputs();

        expect(cell.output).toEqual([]);
    });
    
    test("clearing outputs raises onOutputChanged", async () => {

        const { cell } = await createCellWithOutput();

        await expectEventRaised(cell, "onOutputChanged", async () => {
            await cell.clearOutputs();
        });
    });

    test("can overwrite stale outputs", async () => {

        const { cell } = createCell();

        const { mockCellOutputViewModel: mockOutput1 } = createMockCellOutput();
        await cell.addOutput(mockOutput1);

        const { mockCellOutputViewModel: mockOutput2 } = createMockCellOutput();
        await cell.addOutput(mockOutput2);

        // Mark existing outputs as stale.
        cell.resetOutputs();

        expect(mockOutput1.markStale).toHaveBeenCalled();
        expect(mockOutput2.markStale).toHaveBeenCalled();

        // Add a fresh output.
        const { mockCellOutputViewModel: mockFreshOutput } = createMockCellOutput();
        await cell.addOutput(mockFreshOutput);

        expect(cell.output).toEqual([ mockFreshOutput, mockOutput2 ]);
    });

    test("height is replicated to fresh output when display type is the same", async () => {

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
            getDisplayType: () => "chart", // Same display type as original.
        });

        await cell.addOutput(mockFreshOutput);

        expect(mockFreshOutput.setHeight).toHaveBeenCalledWith(origOutputHeight);
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

        const { mockCellOutputViewModel: mockOutput1 } = createMockCellOutput({ isFresh: () => false });
        await cell.addOutput(mockOutput1);

        const { mockCellOutputViewModel: mockOutput2 } = createMockCellOutput({ isFresh: () => false });
        await cell.addOutput(mockOutput2);

        // Mark existing outputs as stale.
        cell.resetOutputs();

        // Add a fresh output.
        const { mockCellOutputViewModel: mockFreshOutput } = createMockCellOutput({ isFresh: () => true });
        await cell.addOutput(mockFreshOutput);

        cell.clearStaleOutputs();

        expect(cell.output).toEqual([ mockFreshOutput ]);
    });

    test("can add an error", async () => {

        const { cell } = createCell();

        const { mockCellErrorViewModel } = createMockCellError();
        await cell.addError(mockCellErrorViewModel);

        expect(cell.errors).toEqual([ mockCellErrorViewModel ]);
    });

    test("adding an error raises onErrorsChanged", async () => {

        const { cell } = createCell();

        await expectEventRaised(cell, "onErrorsChanged", async () => {
            const { mockCellErrorViewModel } = createMockCellError();
            await cell.addError(mockCellErrorViewModel);
        });
    });

    test("can clear errors", async () => {

        const { cell } = await createCellWithError();

        await cell.clearErrors();

        expect(cell.errors).toEqual([]);
    });
    
    test("clearing errors raises onErrorsChanged", async () => {

        const { cell } = await createCellWithError();

        await expectEventRaised(cell, "onErrorsChanged", async () => {
            await cell.clearErrors();
        });
    });

    test("can overwrite stale errors", async () => {

        const { cell } = createCell();

        const { mockCellErrorViewModel: mockError1 } = createMockCellError();
        await cell.addError(mockError1);

        const { mockCellErrorViewModel: mockError2 } = createMockCellError();
        await cell.addError(mockError2);

        // Mark existing erorrs as stale.
        cell.resetErrors();

        expect(mockError1.markStale).toHaveBeenCalled();
        expect(mockError2.markStale).toHaveBeenCalled();

        // Add a fresh error.
        const { mockCellErrorViewModel: mockFreshError } = createMockCellError();
        await cell.addError(mockFreshError);

        expect(cell.errors).toEqual([ mockFreshError, mockError2 ]);
    });

    test("can clear stale errors", async () => {

        const { cell } = createCell();

        const { mockCellErrorViewModel: mockError1 } = createMockCellError({ isFresh: () => false });
        await cell.addError(mockError1);

        const { mockCellErrorViewModel: mockError2 } = createMockCellError({ isFresh: () => false });
        await cell.addError(mockError2);

        // Mark existing errors as stale.
        cell.resetErrors();

        // Add a fresh error.
        const { mockCellErrorViewModel: mockFreshError } = createMockCellError({ isFresh: () => true });
        await cell.addError(mockFreshError);

        cell.clearStaleErrors();

        expect(cell.errors).toEqual([ mockFreshError ]);
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
