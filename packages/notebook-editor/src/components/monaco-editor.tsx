import * as React from 'react';
import * as monaco from 'monaco-editor';
import { Spinner } from '@blueprintjs/core';
import * as _ from 'lodash';
import { debounceAsync, handleAsyncErrors, ILog, ILogId, throttleAsync } from 'utils';
import { IEditorCaretPosition } from '../view-model/editor-caret-position';
import { InjectableClass, InjectProperty } from '@codecapers/fusion';
import { ICommander, ICommanderId } from '../services/commander';
import { IUndoRedo, IUndoRedoId } from '../services/undoredo';
import { CellTextChange } from '../changes/cell-text-change';
import { IPlatform, IPlatformId } from '../services/platform';
import { ICellViewModel, IFindDetails, ITextRange, SearchDirection } from '../view-model/cell';
import { observer } from 'mobx-react';

let monacoInitialised = false;

//
// Hidden div that contains the hidden editor.
//
let hiddenDiv: HTMLElement | null = null;

//
// Hidden model.
//
let hiddenModel: monaco.editor.IModel | undefined;

//
// Hidden editor used for calculating the expected size of the real editor.
//
let hiddenEditor: monaco.editor.IStandaloneCodeEditor | undefined;

function initializeMonaco() {
    if (monacoInitialised) {
        return;
    }

    monacoInitialised = true;

    // https://stackoverflow.com/a/57169408/25868
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true, //TODO: Want to enable this diagnostic options in the future.
        noSyntaxValidation: true,
    	noSuggestionDiagnostics: true,

    	// https://stackoverflow.com/questions/55116965/is-it-possible-to-remove-certain-errors-from-monaco-editor/71145347#71145347
    	diagnosticCodesToIgnore: [1375, 1378], // Allow "await" at the top level.
    });
    
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: true,
        noSyntaxValidation: true,
    	noSuggestionDiagnostics: true,

    	// https://stackoverflow.com/questions/55116965/is-it-possible-to-remove-certain-errors-from-monaco-editor/71145347#71145347
    	diagnosticCodesToIgnore: [1375, 1378], // Allow "await" at the top level.
    });
    
    monaco.languages.typescript.javascriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2016,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        typeRoots: ["node_modules/@types"],
    });
    
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2016,
        allowNonTsExtensions: true,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
        module: monaco.languages.typescript.ModuleKind.CommonJS,
        noEmit: true,
        typeRoots: ["node_modules/@types"],
    });

    //
    // Create a whole hidden editor just to figure what size the editor should be.
    // This is pretty expensive but it avoids unecessary size changes and scrolling on the real editor.
    // Hope to find a better way to do this in the future.
    //

    hiddenModel = monaco.editor.createModel("", "javascript");
    
    // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.ieditorconstructionoptions.html
    const hiddenOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
        model: hiddenModel,
        codeLens: false,
        formatOnPaste: true,
        formatOnType: true,
        renderLineHighlight: "none",
        wordWrap: "off",
        selectionHighlight: false,
        contextmenu: false,
        readOnly: false,
        hideCursorInOverviewRuler: true,
        automaticLayout: false,
        scrollbar: {
            handleMouseWheel: false,
            vertical: "hidden",
            verticalScrollbarSize: 0,
        },
        minimap: {
            enabled: false,
        },
        scrollBeyondLastLine: false,
        lineNumbers: "off",
        links: false,
        glyphMargin: false,
        showUnused: false, // Have to turn this because it grays our variables that are used in other cells.
    };        

    hiddenDiv = document.getElementById("hidden-monaco-editor");

    //
    // Force hidden editor render at 0 height.
    //
    hiddenDiv!.style.height = "0px";

    hiddenEditor = monaco.editor.create(hiddenDiv!, hiddenOptions);

}

declare const self: any;

self.MonacoEnvironment = {
    getWorkerUrl: function (moduleId: any, label: string): string {
        if (label === 'json') {
            return './json.worker.bundle.js';
        }
        if (label === 'css' || label === 'scss' || label === 'less') {
            return './css.worker.bundle.js';
        }
        if (label === 'html' || label === 'handlebars' || label === 'razor') {
            return './html.worker.bundle.js';
        }
        if (label === 'typescript' || label === 'javascript') {
            return './ts.worker.bundle.js';
        }
        return './editor.worker.bundle.js';
    }
};

export interface IMonacoEditorProps {

    //
    // The language being edited.
    //
    language: string;

    //
    // The model for the code cell.
    //
    cell: ICellViewModel;

    //
    // Set to true to show the progress spinner.
    //
    working?: boolean;

    //
    // Callback when the escape key is pressed.
    //
    onEscapeKey?: () => void;
}

export interface IMonacoEditorState {
}

@InjectableClass()
class MonacoEditorView extends React.Component<IMonacoEditorProps, IMonacoEditorState> {

    @InjectProperty(ILogId)
    log!: ILog;

    @InjectProperty(ICommanderId)
    commander!: ICommander;

    @InjectProperty(IPlatformId)
    platform!: IPlatform;

    @InjectProperty(IUndoRedoId)
    undoRedo!: IUndoRedo;

    //
    // The HTML element that contains the text editor.
    //
    containerElement: React.RefObject<HTMLDivElement>;

    //
    // Models created for the editor.
    //
    editorModel: monaco.editor.IModel | null = null;
    
    // Docs
    // https://microsoft.github.io/monaco-editor/api/modules/monaco.editor.html
    editor: monaco.editor.IStandaloneCodeEditor | null = null;

    //
    // Set to true when code is being updated into the model.
    //
    updatingCode: boolean = false;

    //
    // Debounced function to copy text from Monaco Editor to the view model.
    //
    updateTextInModel!: any;

    //
    // Cached Monaco caret element.
    //
    caretElement: Element | null = null;

    //
    // Disposables for Monaco editor events.
    //
    onDidChangeCursorPositionDisposable?: monaco.IDisposable;
    onDidChangeCursorSelectionDisposable?: monaco.IDisposable;
    onDidChangeModelContentDisposable?: monaco.IDisposable;
    
    //
    // The previous computed height of the editor.
    //
    prevComputedHeight?: number;

    constructor(props: any) {
        super(props);

        this.containerElement = React.createRef<HTMLDivElement>();

        this.state = {};

        this.onWindowResize = _.throttle(this.onWindowResize, 400, { leading: false, trailing: true });
        this.props.cell.caretPositionProvider = this.caretPositionProvider;
        
        // Throttle is used to not just to prevent too many updates, but also because
        // on the first cursor change after the Monaco Editor is focused the caret is
        // at the start of the editor, even when you clicked in the middle of the editor and this
        // causes screwy automatic scrolling of the notebook.
        // Throttling this update removes the initial 'bad scroll' on editor focus.
        this.onCursorPositionChanged = _.throttle(this.onCursorPositionChanged, 100, { leading: false, trailing: true });
        this.onChangeCursorSelection = _.throttle(this.onChangeCursorSelection, 300, { leading: false, trailing: true });
    }

    private invokeNamedCommand(commandId: string) {
        this.commander.invokeNamedCommand(commandId, { cell: this.props.cell as any }) //TODO: This cast to any is a bit dodgy.
            .catch(err => {
                this.log.error("Command " + commandId + " failed.");
                this.log.error(err && err.stack || err);
            });
    }

    componentWillMount() {
        initializeMonaco();
    }

    componentDidMount() {
        const ext = this.props.language === "typescript" ? "ts" : "js"; //todo: is this needed?
        this.editorModel = monaco.editor.createModel(
            this.props.cell.text,
            this.props.language
        );
        
        // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.ieditorconstructionoptions.html
        const options: monaco.editor.IStandaloneEditorConstructionOptions = {
            model: this.editorModel,
            codeLens: false,
            formatOnPaste: true,
            formatOnType: true,
            renderLineHighlight: "none",
            wordWrap: "off",
            selectionHighlight: false,
            contextmenu: false,
            readOnly: false,
            hideCursorInOverviewRuler: true,
            automaticLayout: false,
            scrollbar: {
                handleMouseWheel: false,
                vertical: "hidden",
                verticalScrollbarSize: 0,
            },
            minimap: {
                enabled: false,
            },
            scrollBeyondLastLine: false,
            lineNumbers: "off",
            links: false,
            glyphMargin: false,
            showUnused: false, // Have to turn this because it grays our variables that are used in other cells.
        };

        this.editor = monaco.editor.create(this.containerElement.current!, options);

        const updateEditorHeight = throttleAsync(
            this,
            this.updateEditorHeight,
            100
        );   

        this.updateTextInModel = debounceAsync(this, this.updateCode, 1000);

        this.onDidChangeModelContentDisposable = this.editor.onDidChangeModelContent(
            () => {
                updateEditorHeight();
                if (!this.updatingCode) {
                    this.updateTextInModel(); // No need to pass text back to model when updating.
                }
            }
        );

        //TODO: Be good to type this properly.
        (this.editor as any)._contributions["editor.contrib.folding"].foldingModel.onDidChange((event: any) => {
            if (event.collapseStateChanged) {
                updateEditorHeight();
            }
        });

        this.onDidChangeCursorPositionDisposable = this.editor.onDidChangeCursorPosition(this.onCursorPositionChanged);
        this.onDidChangeCursorSelectionDisposable = this.editor.onDidChangeCursorSelection(this.onChangeCursorSelection);

        handleAsyncErrors(() => this.updateEditorHeight());
        window.addEventListener("resize", this.onWindowResize); //TODO: There should be one event handler for all monaco eidtors and it should debounced.

        //
        // HACK to override Monaco editor keybindings.
        //
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyZ, () => this.invokeNamedCommand("undo"), "");
        if (this.platform.isMacOS()) {
            this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyZ, () => this.invokeNamedCommand("redo"), "");
        }
        else {
            this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyY, () => this.invokeNamedCommand("redo"), "");
        }
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyC, () => this.invokeNamedCommand("copy-cell"), "");
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyX, () => this.invokeNamedCommand("cut-cell"), "");
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyV, () => this.invokeNamedCommand("paste-cell-below"), "");
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.DownArrow, () => this.invokeNamedCommand("focus-next-cell"), "");
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.UpArrow, () => this.invokeNamedCommand("focus-prev-cell"), "");
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.UpArrow, () => this.invokeNamedCommand("focus-top-cell"), "");
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Alt | monaco.KeyCode.DownArrow, () => this.invokeNamedCommand("focus-bottom-cell"), "");
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Enter, () => this.invokeNamedCommand("insert-markdown-cell-below"), "");
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.DownArrow, () => this.invokeNamedCommand("move-cell-down"), "");
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.UpArrow, () => this.invokeNamedCommand("move-cell-up"), "");
        this.editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.Slash, () => this.invokeNamedCommand("toggle-hotkeys"), "");

        if (this.props.onEscapeKey) {
            this.editor.addCommand(monaco.KeyCode.Escape, () => {
                this.props.onEscapeKey!();
            }, "");
        }

        this.props.cell.onSetFocus.attach(this.onSetFocus);
        this.props.cell.onSetCaretPosition.attach(this.onSetCaretPosition);
        this.props.cell.onTextChanged.attach(this.onTextChanged);
        this.props.cell.onFlushChanges.attach(this.onFlushChanges);
        this.props.cell.onEditorSelectionChanged.attach(this.onEditorSelectionChanged);
        this.props.cell.onFindNextMatch.attach(this.onFindNextMatch);
        this.props.cell.onSelectText.attach(this.onSelectText);
        this.props.cell.onDeselectText.attach(this.onDeselectText);
        this.props.cell.onReplaceText.attach(this.onReplaceText);
    }

    componentWillUnmount () {

        if (this.onDidChangeModelContentDisposable) {
            this.onDidChangeModelContentDisposable.dispose();
            this.onDidChangeModelContentDisposable = undefined;
        }

        if (this.onDidChangeCursorPositionDisposable) {
            this.onDidChangeCursorPositionDisposable.dispose();
            this.onDidChangeCursorPositionDisposable = undefined;
        }

        if (this.onDidChangeCursorSelectionDisposable) {
            this.onDidChangeCursorSelectionDisposable.dispose();
            this.onDidChangeCursorSelectionDisposable = undefined;
        }

        if (this.editorModel) {
            this.editorModel.dispose();
            this.editorModel = null;
        }
        
        if (this.editor) {
            this.editor.dispose();
            this.editor = null;
        }

        this.caretElement = null;

        window.removeEventListener("resize", this.onWindowResize);
        this.props.cell.onSetFocus.detach(this.onSetFocus);
        this.props.cell.onSetCaretPosition.detach(this.onSetCaretPosition);
        this.props.cell.onTextChanged.detach(this.onTextChanged);
        this.props.cell.onFlushChanges.detach(this.onFlushChanges);
        this.props.cell.onEditorSelectionChanged.detach(this.onEditorSelectionChanged);
        this.props.cell.onFindNextMatch.detach(this.onFindNextMatch);
        this.props.cell.onSelectText.detach(this.onSelectText);
        this.props.cell.onDeselectText.detach(this.onDeselectText);
        this.props.cell.onReplaceText.detach(this.onReplaceText);
    }

    //
    // Event raised on request to find the next match.
    //
    private onFindNextMatch = async (startingPosition: IEditorCaretPosition, searchDirection: SearchDirection, doSelection: boolean, findDetails: IFindDetails): Promise<void> => {
        if (this.editorModel) {
            if (searchDirection === SearchDirection.Backward && startingPosition.lineNumber === -1) {
                // Need to search from the end of this cell.
                const fullRange = this.editorModel.getFullModelRange();
                startingPosition = {
                    lineNumber: fullRange.endLineNumber,
                    column: fullRange.endColumn,
                };
            }
            const wordSeparators = findDetails.matchWholeWord ? (this.editor?.getOptions() as any).wordSeparators : [];
            const findMatch = searchDirection === SearchDirection.Forward
                ? this.editorModel.findNextMatch(findDetails.text, startingPosition, false, findDetails.matchCase, wordSeparators, false)
                : this.editorModel.findPreviousMatch(findDetails.text, startingPosition, false, findDetails.matchCase, wordSeparators, false);
            if (findMatch) {
                await findDetails.notifyMatchFound(findMatch.range, searchDirection, doSelection);
                return;
            }
        }

        await findDetails.notifyMatchNotFound(searchDirection, doSelection);
    }

    //
    // Event raised when text should be selected.
    //
    private onSelectText = async (range: ITextRange): Promise<void> => {
        if (this.editor) {
            this.editor.setSelection(range);
        }
    }

    //
    // Event raised when text should be selected.
    //
    private onDeselectText = async (): Promise<void> => {
        if (this.editor) {
            this.editor.setSelection({ // This seems like a very hacky way to clear the selection, but it works and I couldn't a more official way.
                startLineNumber: 1, 
                startColumn: 1, 
                endLineNumber: 1, 
                endColumn: 1, 
            });
        }
    }    

    //
    // Event raised when text should be replaced.
    //
    private onReplaceText = async (range: ITextRange, text: string): Promise<void> => {
        if (this.editorModel) {
            await this.onDeselectText();
            this.editorModel.applyEdits([{
                range,
                text,
            }]);
            await this.updateTextInModel.flush(); // Flush text changes so we don't lose them.
        }
    }    

    //
    // Event raised when the selected editor has changed.
    //
    private onEditorSelectionChanged = async (): Promise<void> => {

        if (!this.editor) {
            return;
        }

        //
        // Code for toggling line numbers:
        //
        // if (this.props.model.isSelected()) {
        //     this.editor.updateOptions({ lineNumbers: "on" });
        //     this.hiddenEditor!.updateOptions({ lineNumbers: "on" });
        // }
        // else {
        //     this.editor.updateOptions({ lineNumbers: "off" });
        //     this.hiddenEditor!.updateOptions({ lineNumbers: "off" });
        // }
    }

    //
    // Flush text changes prior to saving.
    //
    private onFlushChanges = async (): Promise<void> => {
        const position = this.editor && this.editor.getPosition();
        await this.updateTextInModel.flush();
        if (this.editor) {
            this.editor.setPosition(position!);
        }
    }

    //
    // Get the rect of an element relative to the document.
    //
    private getElementRect(el: Element) {
        const rect = el.getBoundingClientRect();
        const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const top = rect.top + scrollTop;
        const left = rect.left + scrollLeft;
        return { 
            top, 
            left,
            right: left + rect.width,
            bottom: top + rect.height,
            width: rect.width,
            height: rect.height,
        };
    }

    //
    // Event raised the caret position changes.
    //
    private onCursorPositionChanged = () => {
        if (this.containerElement.current) {
            if (!this.caretElement) {
                this.caretElement = this.containerElement.current!.querySelector("textarea.inputarea"); // Get Monaco's caret.
            }

            if (this.caretElement) {
                const caretRect = this.getElementRect(this.caretElement);
                const caretHeight = 30;
                // this.caretRect = {
                //     left: caretRect.left - 5,
                //     top: caretRect.top - 5 - document.documentElement.scrollTop,
                //     width: 10,
                //     height: caretHeight,
                // };
                // this.forceUpdate();

                const caretBottom = caretRect.top + caretHeight;
                const windowHeight = (window.innerHeight || document.documentElement.clientHeight);
                const verticalGutter = 10;
                if (caretBottom >= document.documentElement.scrollTop + windowHeight) {
                    const newScrollTop = caretBottom - windowHeight + verticalGutter;
                    // console.log(`Cursor off bottom of screen, scrolling to: ${newScrollTop}`)
                    document.documentElement.scrollTop = newScrollTop;
                }
                else if (caretRect.top <= document.documentElement.scrollTop) {
                    const newScrollTop = caretRect.top - verticalGutter;
                    // console.log(`Cursor off bottom of screen, scrolling to: ${newScrollTop}`)
                    document.documentElement.scrollTop = newScrollTop;
                }
            }
        }

        if (this.editor && this.editorModel) {
            const caretPosition = this.editor.getPosition();
            const caretOffset = this.editorModel.getOffsetAt(caretPosition!);

            // 
            // Push caret offset into the view model.
            //
            this.props.cell.caretOffset = caretOffset;
        }
    }
   
    //
    // Event raised when selection has changed.
    //
    private onChangeCursorSelection = (event: any) => {
        if (this.editorModel) {
            const selectedText = this.editorModel.getValueInRange(event.selection);
            this.props.cell.selectedText = selectedText;
            this.props.cell.selectedTextRange = event.selection;
        }
    }

    //
    // Update code changes from the editor into the model.
    //
    private async updateCode(): Promise<void> {
        if (this.editor) {
            const updatedCode = this.editor.getValue();
            
            this.updatingCode = true;
            try {
                //TODO: get rid of this cast.
                await this.undoRedo.applyChanges([new CellTextChange(this.props.cell as any, updatedCode)]); 
            }
            finally {
                this.updatingCode = false;
            }
        }
    }

    //
    // Event raised to give this editor the focus.
    //
    private onSetFocus = async (cell: ICellViewModel): Promise<void> => {
        if (this.editor) {
            this.editor.focus();
        }
    }

    //
    // Allows the view model to retreive the caret position.
    //
    private caretPositionProvider = (): IEditorCaretPosition | null => {
        if (this.editor) {
            return this.editor.getPosition();
        }
        else {
            return null;
        }
    }

    private onSetCaretPosition = async (viewModel: ICellViewModel, caretPosition: IEditorCaretPosition): Promise<void> => {
        if (this.editor) {
            if (caretPosition) {
                this.editor.setPosition(caretPosition);
            }
        }
    }

    //
    // Event raised when the text in the view model has changed.
    //
    private onTextChanged = async (): Promise<void> => {
        if (!this.updatingCode) {
            if (this.editor) {
                const updatedCode = this.props.cell.text;
                if (this.editor.getValue() !== updatedCode) {
                    this.updatingCode = true;
                    try {
                        this.editor.setValue(updatedCode);
                    }
                    finally {
                        this.updatingCode = false;
                    }
                }
            }
        }
    }
   
    //
    // Update the editor height based on the content.
    //
    private async updateEditorHeight(): Promise<void> {
        if (!this.editor) {
            return;
        }

        //
        // https://github.com/Microsoft/monaco-editor/issues/103
        // https://github.com/theia-ide/theia/blob/bfaf5bb0d9a241bfa37f51e7ff9ca62de1755d1a/packages/monaco/src/browser/monaco-editor.ts#L274-L292
        //

        //
        // Make Monaco editor update its scroll height.
        //
        hiddenEditor!.setValue(this.editor.getValue());
        hiddenEditor!.layout();

        console.log("Hidden editor scroll height: " + hiddenEditor!.getScrollHeight()); //fio:

        //
        // Compute desired editor height from the hidden editor.
        //
        const gutter = 10;
        const contentHeight = hiddenEditor!.getScrollHeight() + gutter;

        const computedHeight = contentHeight;
        if (this.prevComputedHeight == computedHeight) {
            //
            // Don't do layout if we don't need it.
            //
            return;
        }

        // 
        // Reset height based on Monaco editor scroll height.
        //
        this.containerElement.current!.style.height = `${computedHeight}px`;
        this.editor!.layout();

        this.prevComputedHeight = computedHeight;
    }
    
    private onWindowResize = (): void => {
        //console.log("Detected window resize, updating editor height.");
        if (this.editor) {
        	this.editor.layout();
        }
    }    

    render () {
        return (
            <div className="pos-relative">
                <div 
                    ref={this.containerElement} 
                    />
                { this.props.working
                    && <div 
                        style={{ 
                            position: "absolute",
                            left: "50%",
                            top: "50%",
                            marginLeft: "-25px",
                            marginTop: "-25px",
                            width: "50px",
                            height: "50px",
                        }}>
                        <Spinner />
                    </div>
                }

                {/* <div 
                    className="fixed"
                    style={{
                        top: `${this.caretRect?.top || "10"}px`,
                        left: `${this.caretRect?.left || "10"}px`,
                        width: `${this.caretRect?.width || "10"}px`,
                        height: `${this.caretRect?.height || "10"}px`,
                        border: "2px solid red",
                    }}
                    >

                </div> */}
            </div>
        );
    }
}

export const MonacoEditor = observer(MonacoEditorView);