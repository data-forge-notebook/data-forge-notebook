import { sleep } from "utils";
import { CellType } from "model";
import { CellViewModel } from "../../view-model/cell";
import { IEditorCaretPosition } from "../../view-model/editor-caret-position";
import { IFindDetails, IMonacoEditorViewModel, ITextRange, SearchDirection } from "../../view-model/monaco-editor";
import { expectEventRaised, trackEventsRaised } from "../lib/utils";

describe("view-model / cell", () => {

    test("can construct", () => {

        const theId = "1234";
        const theCellType = CellType.Code;
        const theText = "const x = 3;";
        const theHeight = 13;
        const cell = new CellViewModel(theId, theCellType, theText, theHeight);
        expect(cell.getId()).toEqual(theId);
        expect(cell.getCellType()).toEqual(CellType.Code);
        expect(cell.getText()).toEqual(theText);
        expect(cell.getHeight()).toEqual(theHeight);
    });

    test("notifyModifed raises onModified event", async () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);

        await expectEventRaised(cell, "onModified", async () => {
            await cell.notifyModified();
        });
    });

    test("setting the text to the same makes no change", async () => {

        const cell = new CellViewModel("", CellType.Code, "hello", undefined);

        expect(await cell.setText("hello")).toBe(false);
    });

    test("setting the text to the different changes the text", async () => {

        const cell = new CellViewModel("", CellType.Code, "hello", undefined);

        const newText = "world";
        expect(await cell.setText(newText)).toBe(true);
        expect(cell.getText()).toBe(newText);
    });

    test("setting the text trims whitespace from the end", async () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);

        const baseText = "Hello world";
        expect(await cell.setText(`${baseText} `)).toBe(true);
        expect(cell.getText()).toEqual(baseText);
    });    

    test("setting text raises onTextChanged event", async () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);

        await expectEventRaised(cell, "onTextChanged", async () => {
            await cell.setText("some text!");
            await sleep(1000); // The event is debounced!
        });
    });

    test("setting text raises onModified event", async () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);

        await expectEventRaised(cell, "onModified", async () => {
            await cell.setText("some text!");
        });
    });

    test("can scroll into view", async () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);

        await expectEventRaised(cell, "onScrollIntoView", async () => {
            await cell.scrollIntoView("some reason");
        });
    });

    test("can set focus", async () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);

        await expectEventRaised(cell, "onSetFocus", async () => {
            await cell.focus();
        });
    });

    test("getting caret postition when provider is not set returns null", () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);

        expect(cell.getCaretPosition()).toBeNull();
    });

    test("getting caret postition forwards to the provider", () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);
        const caretPosition = { lineNumber: 1, column: 2 };
        cell.caretPositionProvider = () => caretPosition;
        expect(cell.getCaretPosition()).toBe(caretPosition);
    });

    test("can set caret position", async () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);
        const caretPosition = { lineNumber: 1, column: 2 };
        await expectEventRaised(
            cell, 
            "onSetCaretPosition", 
            async () => {
                await cell.setCaretPosition(caretPosition);
            },
            async (sender: IMonacoEditorViewModel, caretPositionThatWasSet: IEditorCaretPosition | undefined) => {
                expect(caretPositionThatWasSet).toBe(caretPosition);
            }
        );
      
    });

    test("can set caret offset", () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);
        expect(cell.getCaretOffset()).toBeUndefined();
        const caretOffset = 52;
        cell.setCaretOffset(caretOffset);
        expect(cell.getCaretOffset()).toBe(caretOffset);
    });

    test("can select cell", async () => {
        
        const cell = new CellViewModel("", CellType.Code, "", undefined);
        const events = await trackEventsRaised(cell, ["onEditorSelectionChanging", "onEditorSelectionChanged", "onSetFocus"]);
        
        expect(cell.isSelected()).toBe(false);

        await cell.select();

        expect(cell.isSelected()).toBe(true);

        // Note that sell selection also focuses the cell.
        events.expectEventRaised();
    });

    test("more than one cell selection has no effect", async () => {
        
        const cell = new CellViewModel("", CellType.Code, "", undefined);
        await cell.select();

        const events = await trackEventsRaised(cell, ["onEditorSelectionChanging", "onEditorSelectionChanged", "onSetFocus"]);

        await cell.select();

        expect(cell.isSelected()).toBe(true);

        events.expectEventNotRaised();
    });

    test("can deselect cell", async () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);
        await cell.select();

        expect(cell.isSelected()).toBe(true);

        const events = await trackEventsRaised(cell, ["onEditorSelectionChanging", "onEditorSelectionChanged"]);

        await cell.deselect();

        expect(cell.isSelected()).toBe(false);

        events.expectEventRaised();
    });

    test("deselecting an unselected cell has no effect", async () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);

        expect(cell.isSelected()).toBe(false);

        const events = await trackEventsRaised(cell, ["onEditorSelectionChanging", "onEditorSelectionChanged"]);

        await cell.deselect();

        expect(cell.isSelected()).toBe(false);

        events.expectEventNotRaised();
    });

    test("can select text", async () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);

        const range = { startLineNumber: 1, endLineNumber: 2, startColumn: 3,  endColumn: 4 };
        await expectEventRaised(
            cell, 
            "onSelectText", 
            async () => {
                await cell.selectText(range);
            },
            async (rangeThatWasSelected: ITextRange) => {
                expect(rangeThatWasSelected).toBe(range);
            }  
        );
    });

    test("can deselect text", async () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);
        await expectEventRaised(cell, "onDeselectText", async () => {
            await cell.deselectText();
        });
    });

    test("can replace text", async () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);

        const range = { startLineNumber: 1, endLineNumber: 2, startColumn: 3,  endColumn: 4 };
        const text = "the replacement text";
        await expectEventRaised(
            cell, 
            "onReplaceText", 
            async () => {
                await cell.replaceText(range, text);
            },
            async (rangeThatWasReplaced: ITextRange, replacementText: string) => {
                expect(rangeThatWasReplaced).toBe(range);
                expect(replacementText).toBe(text)
            }  
        );
    });

    test("can set selected text", () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);

        const text = "some text";
        cell.setSelectedText(text);
        expect(cell.getSelectedText()).toEqual(text);
    });

    test("can set selected text range", () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);

        const range = { startLineNumber: 1, endLineNumber: 2, startColumn: 3,  endColumn: 4 };
        cell.setSelectedTextRange(range);
        expect(cell.getSelectedTextRange()).toEqual(range);
    });

    test("can flush changes", async () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);
        await expectEventRaised(cell, "onFlushChanges", async () => {
            await cell.flushChanges();
        });
    });

    test("can find next match", async () => {

        const cell = new CellViewModel("", CellType.Code, "", undefined);

        const startingPosition = { lineNumber: 1, column: 2 };
        const searchDirection = SearchDirection.Backward;
        const doSelection = true;
        const findDetails: any = { text: "text to find" };
        await expectEventRaised(
            cell, 
            "onFindNextMatch", 
            async () => {
                await cell.findNextMatch(startingPosition, searchDirection, doSelection, findDetails);
            },
            async (startingPosition: IEditorCaretPosition, searchDirection: SearchDirection, doSelection: boolean, findDetails: IFindDetails) => {
                const onFindNextMatchParams = { startingPosition, searchDirection, doSelection, findDetails };
                expect(onFindNextMatchParams).toEqual({ startingPosition, searchDirection, doSelection, findDetails });
            }  
        );
    });

    test("can set height", () => {
        const cell = new CellViewModel("", CellType.Code, "", undefined);
        
        expect(cell.getHeight()).toBeUndefined();

        const theHeight = 22;
        cell.setHeight(theHeight);
        expect(cell.getHeight()).toBe(theHeight);
    });    
});

