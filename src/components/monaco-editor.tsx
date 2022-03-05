import * as React from 'react';
import * as monaco from 'monaco-editor';

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
}

export interface IMonacoEditorState {
}

export class MonacoEditor extends React.Component<IMonacoEditorProps, IMonacoEditorState> {

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

    constructor(props: any) {
        super(props);

        this.containerElement = React.createRef<HTMLDivElement>();

        this.state = {};
    }

    componentDidMount() {
        this.editorModel = monaco.editor.createModel(
            "async function hello() {\n}\n\nawait hello();\n\nconst x = 5;\n\nconst x = 3;",
            "javascript"
        );

        // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.ieditorconstructionoptions.html
        const options: monaco.editor.IStandaloneEditorConstructionOptions = {
            model: this.editorModel,
        };

        this.editor = monaco.editor.create(this.containerElement.current!, options);
    }

    componentWillUnmount() {

        if (this.editorModel) {
            this.editorModel.dispose();
            this.editorModel = null;
        }

        if (this.editor) {
            this.editor.dispose();
            this.editor = null;
        }

    }

    render() {
        return (
            <div
                ref={this.containerElement}
                style={{
                    width: "100%",
                    height: "600px",
                    border: "1px solid gray",
                }}
            />
        );
    }
}
