import { CellType } from "model";
import { MarkdownCellViewModel } from "../../view-model/markdown-cell";
import { expectEventNotRaised, expectEventRaised } from "../lib/utils";

describe("view-model / markdown-cell", () => {

    //
    // Creates a cell for testing.
    //
    function createCell() {
        const cell = new MarkdownCellViewModel("", CellType.Markdown, "");
        return { cell };
    }    

    test("can construct", () => {

        const cell = new MarkdownCellViewModel("", CellType.Markdown, "");
        expect(cell.text).toEqual("");
    });

    test("is in preview mode by default", () => {
        
        const { cell } = createCell();
        expect(cell.editing).toBe(false);
    });

    test("can enter edit mode", async () => {

        const { cell } = createCell();
        await cell.enterEditMode();

        expect(cell.editing).toBe(true);
    });

    test("entering edit mode focuses the cell", async () => {

        const { cell } = createCell();

        await expectEventRaised(cell, "onSetFocus", async () => {
            await cell.enterEditMode();
        });
    });

    test("entering edit mode selects the cell", async () => {

        const { cell } = createCell();

        await cell.enterEditMode();

        expect(cell.selected).toBe(true);
    });
    
    test("can return to preview mode", async () => {

        const { cell } = createCell();
        await cell.enterEditMode();
        await cell.enterPreviewMode();

        expect(cell.editing).toBe(false);
    });

    test("entering preview mode flushes changes", async () => {

        const { cell } = createCell();
        await cell.enterEditMode();

        await expectEventRaised(cell, "onFlushChanges", async () => {
            await cell.enterPreviewMode();
        });
    });

    test("entering preview mode again has no effect", async () => {

        const { cell } = createCell();
        await cell.enterEditMode();
        await cell.enterPreviewMode();

        await expectEventNotRaised(cell, "onFlushChanges", async () => {
            await cell.enterPreviewMode();
        });
    });

    test("can serialize markdown cell", () => {
        const theId = "1234";
        const theText = "# Hello markdown;";
        const cell = new MarkdownCellViewModel(theId, CellType.Markdown, theText);
        expect(cell.serialize()).toEqual({
            id: theId,
            cellType: CellType.Markdown,
            code: theText,
            height: undefined,
        });        
    });

    test("can deserialize markdown cell", () => {

        const theId = "1234";
        const theText = "# Hello markdown;";
        const cell = MarkdownCellViewModel.deserialize({
            id: theId,
            cellType: CellType.Markdown,
            code: theText,
        });
        expect(cell.id).toEqual(theId);
        expect(cell.text).toEqual(theText);
        expect(cell.cellType).toEqual(CellType.Markdown);
    });
});