import * as React from "react";
import { MonacoEditor } from "./components/monaco-editor";
import { PluggableVisualization } from "./notebook/cell/output/pluggable-visualization";
import { Button } from "@blueprintjs/core";
import { BasicEventHandler, EventSource } from "./lib/event-source";
import { FindNextMatchEventHandler, FocusedEventHandler, ReplaceTextEventHandler, EditorSelectionChangedEventHandler, SelectTextEventHandler, SetCaretPositionEventHandler } from "./view-model/monaco-editor";

function makeModel(text: string): any {

    const onTextChanged = new EventSource<BasicEventHandler>();
    const onSetFocus = new EventSource<FocusedEventHandler>();
    const onSetCaretPosition = new EventSource<SetCaretPositionEventHandler>();
    const onEditorSelectionChanging = new EventSource<EditorSelectionChangedEventHandler>();
    const onEditorSelectionChanged = new EventSource<EditorSelectionChangedEventHandler>();
    const onSelectText = new EventSource<SelectTextEventHandler>();
    const onDeselectText = new EventSource<BasicEventHandler>();
    const onReplaceText = new EventSource<ReplaceTextEventHandler>();
    const onFlushChanges = new EventSource<BasicEventHandler>();
    const onFindNextMatch = new EventSource<FindNextMatchEventHandler>();

    const model: any = {
        getText: () => {
            return text;
        },

        setText: async (_text: string): Promise<void> => {
            text = _text;
            await onTextChanged.raise();
        },

        setSelectedText: () => {
        },

        setCaretOffset: () => {

        },

        setSelectedTextRange: () => {

        },

        onTextChanged,
        onSetFocus,
        onSetCaretPosition,
        onEditorSelectionChanging,
        onEditorSelectionChanged,
        onSelectText,
        onDeselectText,
        onReplaceText,
        onFlushChanges,
        onFindNextMatch,
    };

    return model;
}

export function NotebookEditor() {
    return (
        <div>
            <Button icon="refresh" />
            <MonacoEditor 
                model={makeModel("const x = 1;")}
                language="javascript"
                />       
            <hr />
            <h1>Pluggable visualization test run:</h1>     
            <PluggableVisualization
                config={{
                    data: {
                        some: "data",
                        array: [1, 2, 3],
                    },
                }}
                />
        </div>
    );
}
