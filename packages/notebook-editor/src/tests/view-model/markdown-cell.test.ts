import { CellType } from "model";
import { MarkdownCellViewModel } from "../../view-model/markdown-cell";
import { expectEventNotRaised, expectEventRaised } from "../lib/utils";

describe("view-model / markdown-cell", () => {

	//
    // Creates a cell view model for testing.
    //
    function createCellViewModel() {
        return new MarkdownCellViewModel("", CellType.Markdown, "", undefined);
    }

    //
    // Creates a cell for testing.
    //
    function createCell() {
        const cell = createCellViewModel();
        return { cell };
    }    

    test("can construct", () => {
        createCell();
    });

    test("is in preview mode by default", () => {
        
        const { cell } = createCell();
        expect(cell.isEditing()).toBe(false);
    });

    test("can enter edit mode", async () => {

        const { cell } = createCell();
        await cell.enterEditMode();

        expect(cell.isEditing()).toBe(true);
    });

    test("entering edit mode raises onModeChanged", async () => {

        const { cell } = createCell();

        await expectEventRaised(cell, "onModeChanged", async () => {
            await cell.enterEditMode();
        });
    });

    test("entering edit mode again has no effect", async () => {

        const { cell } = createCell();

        await cell.enterEditMode();

        await expectEventNotRaised(cell, "onModeChanged", async () => {
            await cell.enterEditMode();
        });
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

        expect(cell.isSelected()).toBe(true);
    });
    
    test("can return to preview mode", async () => {

        const { cell } = createCell();
        await cell.enterEditMode();
        await cell.enterPreviewMode();

        expect(cell.isEditing()).toBe(false);
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

    test("entering preview mode raises onModeChanged", async () => {

        const { cell } = createCell();
        await cell.enterEditMode();

        await expectEventRaised(cell, "onModeChanged", async () => {
            await cell.enterPreviewMode();
        });
    });

});