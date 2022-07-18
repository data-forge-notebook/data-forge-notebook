import { disableInjector } from "@codecapers/fusion";
import { EventSource, BasicEventHandler } from "utils";
import { CellScope } from "../../model/cell";
import { ICellErrorViewModel } from "../../view-model/cell-error";
import { ICellOutputViewModel } from "../../view-model/cell-output";
import { CodeCellViewModel, ICodeCellViewModel } from "../../view-model/code-cell";
import { expectEventNotRaised, expectEventRaised } from "../lib/utils";

describe("view-model / code-cell", () => {
    
    beforeAll(() => {
        disableInjector();
    });

	//
    // Creates a cell view model for testing.
    //
    function createCellViewModel(mockModel: any, output: ICellOutputViewModel[] = [], errors: ICellErrorViewModel[] = []) {
        const cell = new CodeCellViewModel(mockModel, output, errors);
        return cell;
    }

    //
    // Creates a cell for testing.
    //
    function createCell() {
        const mockModel: any = {
            getCellScope: () => CellScope.Local,
            setCellScope: jest.fn(),
            addOutput: jest.fn(),
            clearOutputs: jest.fn(),
            resetOutputs: jest.fn(),
            clearStaleOutputs: jest.fn(),
            addError: jest.fn(),
            clearErrors: jest.fn(),
            resetErrors: jest.fn(),
            clearStaleErrors: jest.fn(),
        };
        const cell = createCellViewModel(mockModel);
        return { cell, mockModel };
    }

    //
    // Creates a mock output that can be added to a cell.
    //
    function createMockCellOutput(fields?: any) {
        const mockCellOutputModel: any = {};
        const mockCellOutputViewModel: any = {
            getModel: () => mockCellOutputModel,
            onModified: new EventSource<BasicEventHandler>(),
            markStale: jest.fn(),
            getHeight: () => undefined,
            setHeight: jest.fn(),
            ...fields,
        };
        return { mockCellOutputViewModel, mockCellOutputModel };
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
        const { cell, mockModel } = createCell();

        const { mockCellOutputViewModel, mockCellOutputModel } = createMockCellOutput();
        await cell.addOutput(mockCellOutputViewModel);

        return { cell, mockModel, mockCellOutputViewModel, mockCellOutputModel };
    }

    //
    // Creates a cell with one mock error.
    //
    async function createCellWithError() {
        const { cell, mockModel } = createCell();

        const { mockCellErrorViewModel, mockCellErrorModel } = createMockCellError();
        await cell.addError(mockCellErrorViewModel);

        return { cell, mockModel, mockCellErrorViewModel, mockCellErrorModel };
    }

    test("can construct", () => {

        const now = new Date();
        const mockModel: any = {
            getLastEvaluationDate: () => now,
            getCellScope: () => CellScope.Local,
        };
        const output: ICellOutputViewModel[] = [];
        const errors: ICellErrorViewModel[] = [];
        const cell = createCellViewModel(mockModel, output, errors);

        expect(cell.getLastEvaluationDate()).toBe(now);
        expect(cell.getCellScope()).toBe(CellScope.Local);
        expect(cell.getOutput()).toBe(output);
        expect(cell.getErrors()).toBe(errors);
    });

    test("can set cell scope", async () => {

        const { cell, mockModel } = createCell();

        await cell.setCellScope(CellScope.Global);

        expect(mockModel.setCellScope).toBeCalledWith(CellScope.Global);
    });

    test("setting cell scope raises onModified", async () => {

        const { cell } = createCell();

        await expectEventRaised(cell, "onModified", async () => {
            await cell.setCellScope(CellScope.Global);
        });
    });

    test("setting cell scope to the same has no effect", async () => {

        const { cell } = createCell();

        await expectEventNotRaised(cell, "onModified", async () => {
            await cell.setCellScope(CellScope.Local);
        });
    });

    test("can add an output", async () => {

        const { cell } = createCell();

        const { mockCellOutputViewModel } = createMockCellOutput();
        await cell.addOutput(mockCellOutputViewModel);

        expect(cell.getOutput()).toEqual([ mockCellOutputViewModel ]);
    });

    test("adding an output adds it to the model", async () => {

        const { cell, mockModel } = createCell();

        const { mockCellOutputViewModel, mockCellOutputModel } = createMockCellOutput();
        await cell.addOutput(mockCellOutputViewModel);

        expect(mockModel.addOutput).toHaveBeenCalledWith(mockCellOutputModel);
    });

    test("adding an output raises onOutputChanged", async () => {

        const { cell } = createCell();

        await expectEventRaised(cell, "onOutputChanged", async () => {
            const { mockCellOutputViewModel } = createMockCellOutput();
            await cell.addOutput(mockCellOutputViewModel);
        });
    });

    test("can clear outputs", async () => {

        const { cell } = await createCellWithOutput();

        await cell.clearOutputs();

        expect(cell.getOutput()).toEqual([]);
    });
    
    test("clearing outputs is forwarded to the model", async () => {

        const { cell, mockModel } = await createCellWithOutput();

        await cell.clearOutputs();

        expect(mockModel.clearOutputs).toHaveBeenCalled();
    });

    test("clearing outputs raises onOutputChanged", async () => {

        const { cell } = await createCellWithOutput();

        await expectEventRaised(cell, "onOutputChanged", async () => {
            await cell.clearOutputs();
        });
    });

    test("onModified bubbles up from an output", async () => {

        const { cell, mockCellOutputViewModel } = await createCellWithOutput();

        await expectEventRaised(cell, "onModified", async () => {
            await mockCellOutputViewModel.onModified.raise();   
        });
    });

    test("onModified no longer bubbles up from a removed output", async () => {

        const { cell, mockCellOutputViewModel } = await createCellWithOutput();

        await cell.clearOutputs();

        await expectEventNotRaised(cell, "onModified", async () => {
            await mockCellOutputViewModel.onModified.raise();   
        });
    });

    test("can overwrite stale outputs", async () => {

        const { cell, mockModel } = createCell();

        const { mockCellOutputViewModel: mockOutput1 } = createMockCellOutput();
        await cell.addOutput(mockOutput1);

        const { mockCellOutputViewModel: mockOutput2 } = createMockCellOutput();
        await cell.addOutput(mockOutput2);

        // Mark existing outputs as stale.
        cell.resetOutputs();

        expect(mockModel.resetOutputs).toHaveBeenCalled();
        expect(mockOutput1.markStale).toHaveBeenCalled();
        expect(mockOutput2.markStale).toHaveBeenCalled();

        // Add a fresh output.
        const { mockCellOutputViewModel: mockFreshOutput } = createMockCellOutput();
        await cell.addOutput(mockFreshOutput);

        expect(cell.getOutput()).toEqual([ mockFreshOutput, mockOutput2 ]);
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

        const { cell, mockModel } = createCell();

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

        expect(mockModel.clearStaleOutputs).toHaveBeenCalled();

        expect(cell.getOutput()).toEqual([ mockFreshOutput ]);
    });

    test("can add an error", async () => {

        const { cell } = createCell();

        const { mockCellErrorViewModel } = createMockCellError();
        await cell.addError(mockCellErrorViewModel);

        expect(cell.getErrors()).toEqual([ mockCellErrorViewModel ]);
    });

    test("in error returns false when no errors are added", () => {

        const { cell } = createCell();

        expect(cell.inError()).toBe(false);
    });

    test("in error returns true when an error has been added", async () => {

        const { cell } = await createCellWithError();

        expect(cell.inError()).toBe(true);
    });

    test("adding an error adds it to the model", async () => {

        const { cell, mockModel } = createCell();

        const { mockCellErrorViewModel, mockCellErrorModel } = createMockCellError();
        await cell.addError(mockCellErrorViewModel);

        expect(mockModel.addError).toHaveBeenCalledWith(mockCellErrorModel);
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

        expect(cell.getErrors()).toEqual([]);
    });
    
    test("clearing errors is forwarded to the model", async () => {

        const { cell, mockModel } = await createCellWithError();

        await cell.clearErrors();

        expect(mockModel.clearErrors).toHaveBeenCalled();
    });

    test("clearing errors raises onErrorsChanged", async () => {

        const { cell } = await createCellWithError();

        await expectEventRaised(cell, "onErrorsChanged", async () => {
            await cell.clearErrors();
        });
    });

    test("can overwrite stale errors", async () => {

        const { cell, mockModel } = createCell();

        const { mockCellErrorViewModel: mockError1 } = createMockCellError();
        await cell.addError(mockError1);

        const { mockCellErrorViewModel: mockError2 } = createMockCellError();
        await cell.addError(mockError2);

        // Mark existing erorrs as stale.
        cell.resetErrors();

        expect(mockModel.resetErrors).toHaveBeenCalled();
        expect(mockError1.markStale).toHaveBeenCalled();
        expect(mockError2.markStale).toHaveBeenCalled();

        // Add a fresh error.
        const { mockCellErrorViewModel: mockFreshError } = createMockCellError();
        await cell.addError(mockFreshError);

        expect(cell.getErrors()).toEqual([ mockFreshError, mockError2 ]);
    });

    test("can clear stale errors", async () => {

        const { cell, mockModel } = createCell();

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

        expect(mockModel.clearStaleErrors).toHaveBeenCalled();

        expect(cell.getErrors()).toEqual([ mockFreshError ]);
    });

});
