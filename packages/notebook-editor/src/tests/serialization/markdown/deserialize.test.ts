import { disableInjector, enableInjector } from "@codecapers/fusion";
import { deserializeCellError, deserializeCellOutput, deserializeCellOutputValue, deserializeCodeCell, deserializeMarkdownCell, deserializeNotebook } from "../../../serialization/markdown/deserialize";
import { after } from "lodash";
import { serializeError } from "../../../serialization/markdown/serialize";
import { CellErrorViewModel } from "../../../view-model/cell-error";
import { dedent } from "utils";
import t from "typy";
import { CellType } from "model";

describe('markdown deserialize', () => {

    beforeAll(() => {
        disableInjector();
    });

    afterAll(() => {
        enableInjector();
    });

    test("can deserialize cell error", () => {

        const theErrorMessage = "the error message";
        const fence = "```";
        const input = dedent`
            ${fence}json - error
            ${theErrorMessage}
            ${fence}
        `;

        const cellError = deserializeCellError(input);

        expect(cellError.msg).toBe(theErrorMessage);
    });

    test("can deserialize cell output value", () => {

        const theOutputValue = {
            displayType: "display type",
            plugin: "plugin",
            data: "data",
        };
        const cellOutputValue = deserializeCellOutputValue(theOutputValue);

        expect(cellOutputValue).toEqual(theOutputValue);
    });

    test("can deserialize cell output", () => {

        const theOutput = {
            value: {
                displayType: "display type",
                plugin: "plugin",
                data: "data",
            },
            height: 42,
        };
        const fence = "```";
        const input = dedent`
            ${fence}json - output
            ${JSON.stringify(theOutput)}
            ${fence}
        `;

        const cellOutput = deserializeCellOutput(input);
        expect(cellOutput.instanceId).toBeDefined();
        expect(cellOutput.value).toEqual(theOutput.value);
        expect(cellOutput.height).toEqual(theOutput.height);
        expect(cellOutput.fresh).toBe(true);
        expect(cellOutput.modified).toBe(false);
    });

    test('can deserialize code cell', () => {

        const fence = "```";
        const theCode = `console.log("hello world");`
        const theCodeCell = dedent`
            ${fence}typescript
            ${theCode}
            ${fence}
            ######
            ${fence}json - error
            the error message
            ${fence}
            ######
            ${fence}json - output
            {"value":{"displayType":"display type","plugin":"plugin","data":"data"},"height":42}
            ${fence}            
        `;

        const codeCell = deserializeCodeCell(theCodeCell);
        expect(codeCell.instanceId).toBeDefined();
        expect(codeCell.cellType).toBe(CellType.Code);
        expect(codeCell.selected).toBe(false);
        expect(codeCell.text).toBe(theCode);
        expect(codeCell.modified).toBe(false);
        expect(codeCell.output.length).toBe(1);
        expect(codeCell.output[0]).toBeDefined();
        expect(codeCell.errors.length).toBe(1);
        expect(codeCell.errors[0]).toBeDefined();
    });

    test("can deserialize markdown", () => {
            const theMarkdown = `# Hello World!`;
            const markdownCell = deserializeMarkdownCell(theMarkdown);
            expect(markdownCell.instanceId).toBeDefined();
            expect(markdownCell.cellType).toBe(CellType.Markdown);
            expect(markdownCell.selected).toBe(false);
            expect(markdownCell.text).toBe(theMarkdown);
            expect(markdownCell.modified).toBe(false);
    });

    test("can deserialize notebook", () => {
            
        const fence = "```";
        const theCode = `console.log("hello world");`
        const theMarkdown = `# Hello World!`;
        const theDescription = `A great notebook`;
        const theNotebook = dedent`
            ---
            version: 1
            description: ${theDescription}
            ---
            ${fence}typescript
            ${theCode}
            ${fence}
            ######
            ${fence}json - error
            the error message
            ${fence}
            ######
            ${fence}json - output
            {"value":{"displayType":"display type","plugin":"plugin","data":"data"},"height":42}
            ${fence}            
            ------
            ${theMarkdown}
        `;

        const mockId: any = {};
        const notebook = deserializeNotebook(mockId, false, false, theNotebook);
        expect(notebook.instanceId).toBeDefined();
        expect(notebook.description).toBe(theDescription);
        expect(notebook.modified).toBe(false);
        expect(notebook.unsaved).toBe(false);
        expect(notebook.readOnly).toBe(false);
        expect(notebook.selectedCell).toBeUndefined();
        expect(notebook.cells.length).toBe(2);
        expect(notebook.cells[0].cellType).toBe(CellType.Code);
        expect(notebook.cells[1].cellType).toBe(CellType.Markdown);
    });
});