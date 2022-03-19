import * as React from 'react';
import * as monaco from 'monaco-editor';
import { Spinner } from '@blueprintjs/core';
import * as _ from 'lodash';
import { debounceAsync, handleAsyncErrors, throttleAsync } from '../lib/async-handler';

let monacoInitialised = false;

function initializeMonaco() {
    if (monacoInitialised) {
        return;
    }

    monacoInitialised = true;

    // https://stackoverflow.com/a/57169408/25868
    monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true);
    monaco.languages.typescript.typescriptDefaults.setEagerModelSync(true);

   
    monaco.languages.typescript.javascriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
    	noSuggestionDiagnostics: false,

    	// https://stackoverflow.com/questions/55116965/is-it-possible-to-remove-certain-errors-from-monaco-editor/71145347#71145347
    	diagnosticCodesToIgnore: [1375, 1378], // Allow "await" at the top level.
    });
    
    monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
        noSemanticValidation: false,
        noSyntaxValidation: false,
    	noSuggestionDiagnostics: false,

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
    // Text to display in the editor.
    //
    text: string;

    //
    // Sets the minimum height of the text editor.
    //
    minHeight?: number;

    //
    // Set to true to show the progress spinner.
    //
    working?: boolean;

    //
    // Callback when the escape key is pressed.
    //
    onEscapeKey?: () => void;

    //
    // Event raised when the height has changed.
    //
    onHeightChanged?: (newHeight: number) => void;

    //
    // Event raised when the text in the editor has changed.
    //
    onChange: (text: string) => Promise<void>;
}

export interface IMonacoEditorState {
}

export class MonacoEditor extends React.Component<IMonacoEditorProps, IMonacoEditorState> {

    //
    // The HTML element that contains the text editor.
    //
    containerElement: React.RefObject<HTMLDivElement>;

    //
    // Container for the hidden Monaco editor used to compute the desired size of the visible Monaco editor.
    //
    hiddenContainerElement: React.RefObject<HTMLDivElement>;

    //
    // Models created for the editor.
    //
    editorModel: monaco.editor.IModel | null = null;

    
    // Docs
    // https://microsoft.github.io/monaco-editor/api/modules/monaco.editor.html
    editor: monaco.editor.IStandaloneCodeEditor | null = null;

    //
    // Hidden div that contains the hidden editor.
    //
    hiddenDiv?: HTMLDivElement;

    //
    // Hidden model.
    //
    hiddenModel: monaco.editor.IModel | null = null;

    //
    // Hidden editor used for calculating the expected size of the real editor.
    //
    hiddenEditor: monaco.editor.IStandaloneCodeEditor | null = null;

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
        this.hiddenContainerElement = React.createRef<HTMLDivElement>();

        this.state = {};

        this.onWindowResize = _.throttle(this.onWindowResize.bind(this), 400, { leading: false, trailing: true });
        this.onCodeChanged = this.onCodeChanged.bind(this);
        this.onFlushChanges = this.onFlushChanges.bind(this);
    }

    componentWillMount() {
        initializeMonaco();
    }

    componentDidMount() {
        const ext = this.props.language === "typescript" ? "ts" : "js"; //todo: is this needed?
        this.editorModel = monaco.editor.createModel(
            this.props.text,
            this.props.language
        );
        
        // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.ieditorconstructionoptions.html
        const options: monaco.editor.IStandaloneEditorConstructionOptions = {
            model: this.editorModel,
            codeLens: false,
            formatOnPaste: true,
            formatOnType: true,
            renderLineHighlight: "none",
            wordWrap: "on",
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

        //
        // Create a whole hidden editor just to figure what size the editor should be.
        // This is pretty expensive but it avoids unecessary size changes and scrolling on the real editor.
        // Hope to find a better way to do this in the future.
        //

        this.hiddenModel = monaco.editor.createModel(
            this.props.text,
            this.props.language
        );
        
        // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.ieditorconstructionoptions.html
        const hiddenOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
            model: this.hiddenModel,
            codeLens: false,
            formatOnPaste: true,
            formatOnType: true,
            renderLineHighlight: "none",
            wordWrap: "on",
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

		//TODO: Be nice if this worked! Then I could share the hidden editor among multiple cells.
        // this.hiddenDiv = document.createElement("div"); 
        this.hiddenDiv = this.hiddenContainerElement.current!;
        this.hiddenEditor = monaco.editor.create(this.hiddenDiv, hiddenOptions);

        const updateEditorHeight = throttleAsync(
            this,
            this.updateEditorHeight,
            100
        );   

        this.updateTextInModel = debounceAsync(this, this.updateCode, 100);

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

        handleAsyncErrors(() => this.updateEditorHeight());
        window.addEventListener("resize", this.onWindowResize); //TODO: There should be one event handler for all monaco eidtors and it should debounced.

        if (this.props.onEscapeKey) {
            this.editor.addCommand(monaco.KeyCode.Escape, () => {
                this.props.onEscapeKey!();
            }, "");
        }
      
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

        if (this.hiddenModel) {
            this.hiddenModel.dispose();
            this.hiddenModel = null;
        }

        if (this.hiddenEditor) {
            this.hiddenEditor.dispose();
            this.hiddenEditor = null;
        }

        this.hiddenDiv = undefined;
        this.caretElement = null;

        window.removeEventListener("resize", this.onWindowResize);
    }

    //
    // Flush text changes prior to saving.
    //
    async onFlushChanges(): Promise<void> {
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
    // Update code changes from the editor into the model.
    //
    private async updateCode(): Promise<void> {
        if (this.editor) {
            const updatedCode = this.editor.getValue();
            
            this.updatingCode = true;
            try {
                await this.props.onChange(updatedCode);
            }
            finally {
                this.updatingCode = false;
            }
        }
    }

    private onCodeChanged(): void {
        if (!this.updatingCode) {
            if (this.editor) {
                const updatedCode = this.props.text;
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
        // Force hidden editor render at 0 height.
        // Makes Monaco editor update its scroll height.
        //
        this.hiddenDiv!.style.height = "0px";
        this.hiddenEditor!.setValue(this.editor.getValue());
        this.hiddenEditor!.layout();

        //
        // Compute desired editor height from the hidden editor.
        //
        const minHeight = this.props.minHeight || 16;
        const gutter = 10;
        const contentHeight = this.hiddenEditor!.getScrollHeight() + gutter;
        const computedHeight = Math.max(minHeight, contentHeight);
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

        if (this.props.onHeightChanged) {
            this.props.onHeightChanged(computedHeight);
        }
    }
    
    private onWindowResize(): void {
        //console.log("Detected window resize, updating editor height.");
        if (this.editor) {
        	this.editor.layout();
        }
    }    
    
    shouldComponentUpdate (nextProps: IMonacoEditorProps, nextState: IMonacoEditorState) {

        if (nextProps.working !== this.props.working) {
            this.forceUpdate(); //TODO: Shouldn't have to do this here.
        }

        if (this.editor!.getValue() !== nextProps.text) { //TODO: Is this really needed?
            this.editor!.setValue(nextProps.text);
        }

        return false; // No need to ever rerender.
    }

    render () {
        return (
            <div className="pos-relative">
                <div 
                    ref={this.containerElement} 
                    />
                <div 
                    ref={this.hiddenContainerElement} 
                    style={{
                        overflow: "hidden",
                    }}
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
