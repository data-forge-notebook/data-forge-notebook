import * as React from 'react';

declare const monaco: any;

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
    editorModel: any; //monaco.editor.IModel | null = null;

    // Docs
    // https://microsoft.github.io/monaco-editor/api/modules/monaco.editor.html
    editor: any; //monaco.editor.IStandaloneCodeEditor | null = null;

    constructor(props: any) {
        super(props);

        this.containerElement = React.createRef<HTMLDivElement>();

        this.state = {};
    }

    componentDidMount() {
        this.editorModel = monaco.editor.createModel(
            "let x = 1;",
            "javascript"
        );
        
        // https://microsoft.github.io/monaco-editor/api/interfaces/monaco.editor.ieditorconstructionoptions.html
        const options: any /*todo: monaco.editor.IEditorConstructionOptions*/ = {
            model: this.editorModel,
        };

        this.editor = monaco.editor.create(this.containerElement.current!, options);
    }

    componentWillUnmount () {

        if (this.editorModel) {
            this.editorModel.dispose();
            this.editorModel = null;
        }
        
        if (this.editor) {
            this.editor.dispose();
            this.editor = null;
        }

    }

    render () {
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
