import { CellType } from "../../model/cell";
import { CellViewModel } from "../../view-model/cell";
import { IEditorCaretPosition } from "../../view-model/editor-caret-position";
import { IFindDetails, IMonacoEditorViewModel, ITextRange, SearchDirection } from "../../view-model/monaco-editor";
import { expectEventRaised, trackEventsRaised } from "../lib/utils";

describe("view-model / cell", () => {

	//
    // Creates a cell view model for testing.
    //
    function createCellViewModel(mockModel: any) {
        const cell = new CellViewModel(mockModel);
        return cell;
    }

    test("can construct", () => {

        const id = "1234";
        const text = "some code!";
        const serialized = {};
        const mockModel: any = {
            getId: () => id,
            getCellType: () => CellType.Code,
            getText: () => text,
            getHeight: () => 12,
            serialize: () => serialized,
        };
        const cell = createCellViewModel(mockModel);
        expect(cell.getId()).toEqual(id);
        expect(cell.getModel()).toBeDefined();
        expect(cell.getCellType()).toEqual(CellType.Code);
        expect(cell.getText()).toEqual(text);
        expect(cell.getHeight()).toEqual(12);
        expect(cell.serialize()).toBe(serialized);
    });

    test("notifyModifed raises onModified event", async () => {

        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);

        await expectEventRaised(cell, "onModified", async () => {
            await cell.notifyModified();
        });
    });

    test("setting text is passed through to the model", async () => {

        let textThatWasSet: string | undefined;
        const mockModel: any = {
            setText: (text: string) => {
                textThatWasSet = text;
            },
        };
        const cell = createCellViewModel(mockModel);
        
        const textToSet = "some text!";
        await cell.setText(textToSet);
        expect(textThatWasSet).toEqual(textToSet);
    });

    test("setting text raises onTextChanged event", async () => {

        const mockModel: any = {
            setText: () => true,
        };
        const cell = createCellViewModel(mockModel);

        await expectEventRaised(cell, "onTextChanged", async () => {
            await cell.setText("some text!");
        });
    });

    test("setting text raises onModified event", async () => {

        const mockModel: any = {
            setText: () => true,
        };
        const cell = createCellViewModel(mockModel);

        await expectEventRaised(cell, "onModified", async () => {
            await cell.setText("some text!");
        });
    });

    test("setting the height is passed through to the model", async () => {

        let heightThatWasSet: number | undefined;
        const mockModel: any = {
            setHeight: (height: number) => {
                heightThatWasSet = height;
            },
        };
        const cell = createCellViewModel(mockModel);
        
        await cell.setHeight(33);
        expect(heightThatWasSet).toEqual(33);
    });

    test("can scroll into view", async () => {

        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);
        await expectEventRaised(cell, "onScrollIntoView", async () => {
            await cell.scrollIntoView("some reason");
        });
    });

    test("can set focus", async () => {

        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);
        await expectEventRaised(cell, "onSetFocus", async () => {
            await cell.focus();
        });
    });

    test("getting caret postition when provider is not set returns null", () => {

        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);
        expect(cell.getCaretPosition()).toBeNull();
    });

    test("getting caret postition forwards to the provider", () => {

        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);
        const caretPosition = { lineNumber: 1, column: 2 };
        cell.caretPositionProvider = () => caretPosition;
        expect(cell.getCaretPosition()).toBe(caretPosition);
    });

    test("can set caret position", async () => {

        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);
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

        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);
        expect(cell.getCaretOffset()).toBeUndefined();
        const caretOffset = 52;
        cell.setCaretOffset(caretOffset);
        expect(cell.getCaretOffset()).toBe(caretOffset);
    });

    test("can select cell", async () => {
        
        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);
        const events = await trackEventsRaised(cell, ["onEditorSelectionChanging", "onEditorSelectionChanged", "onSetFocus"]);
        
        expect(cell.isSelected()).toBe(false);

        await cell.select();

        expect(cell.isSelected()).toBe(true);

        // Note that sell selection also focuses the cell.
        events.expectEventRaised();
    });

    test("more than one cell selection has no effect", async () => {
        
        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);
        await cell.select();

        const events = await trackEventsRaised(cell, ["onEditorSelectionChanging", "onEditorSelectionChanged", "onSetFocus"]);

        await cell.select();

        expect(cell.isSelected()).toBe(true);

        events.expectEventNotRaised();
    });

    test("can deselect cell", async () => {

        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);
        await cell.select();

        expect(cell.isSelected()).toBe(true);

        const events = await trackEventsRaised(cell, ["onEditorSelectionChanging", "onEditorSelectionChanged"]);

        await cell.deselect();

        expect(cell.isSelected()).toBe(false);

        events.expectEventRaised();
    });

    test("deselecting an unselected cell has no effect", async () => {

        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);

        expect(cell.isSelected()).toBe(false);

        const events = await trackEventsRaised(cell, ["onEditorSelectionChanging", "onEditorSelectionChanged"]);

        await cell.deselect();

        expect(cell.isSelected()).toBe(false);

        events.expectEventNotRaised();
    });

    test("can select text", async () => {

        let rangeThatWasSelected: ITextRange | undefined;
        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);

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

        let onDeselectTextRaised = false;
        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);
        await expectEventRaised(cell, "onDeselectText", async () => {
            await cell.deselectText();
        });
    });

    test("can replace text", async () => {

        let rangeThatWasReplaced: ITextRange | undefined;
        let replacementText: string | undefined;
        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);

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

        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);

        const text = "some text";
        cell.setSelectedText(text);
        expect(cell.getSelectedText()).toEqual(text);
    });

    test("can set selected text range", () => {

        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);

        const range = { startLineNumber: 1, endLineNumber: 2, startColumn: 3,  endColumn: 4 };
        cell.setSelectedTextRange(range);
        expect(cell.getSelectedTextRange()).toEqual(range);
    });

    test("can flush changes", async () => {

        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);
        await expectEventRaised(cell, "onFlushChanges", async () => {
            await cell.flushChanges();
        });
    });

    test("can find next match", async () => {

        const mockModel: any = {};
        const cell = createCellViewModel(mockModel);

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
});

