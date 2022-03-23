import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';

import { MonacoEditor } from '../components/monaco-editor';
import { EventSource, BasicEventHandler } from '../lib/event-source';
import { FindNextMatchEventHandler, FocusedEventHandler, ReplaceTextEventHandler, EditorSelectionChangedEventHandler, SelectTextEventHandler, SetCaretPositionEventHandler } from '../view-model/monaco-editor';

//👇 This default export determines where your story goes in the story list
export default {
    /* 👇 The title prop is optional.
    * See https://storybook.js.org/docs/react/configure/overview#configure-story-loading
    * to learn how to generate automatic titles
    */
    title: 'Monaco Editor',
    component: MonacoEditor,
} as ComponentMeta<typeof MonacoEditor>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof MonacoEditor> = (args) => (
    <div className="border border-solid border-red-600">
        <MonacoEditor {...args} />
    </div>
);

function makeModel(text: string): any {

    const onTextChanged = new EventSource<BasicEventHandler>("onTextChanged");
    const onSetFocus = new EventSource<FocusedEventHandler>("onSetFocus");
    const onSetCaretPosition = new EventSource<SetCaretPositionEventHandler>("onSetCaretPosition");
    const onEditorSelectionChanging = new EventSource<EditorSelectionChangedEventHandler>("onEditorSelectionChanging");
    const onEditorSelectionChanged = new EventSource<EditorSelectionChangedEventHandler>("onEditorSelectionChanged");
    const onSelectText = new EventSource<SelectTextEventHandler>("onSelectText");
    const onDeselectText = new EventSource<BasicEventHandler>("onDeselectText");
    const onReplaceText = new EventSource<ReplaceTextEventHandler>("onReplaceText");
    const onFlushChanges = new EventSource<BasicEventHandler>("onFlushChanges");
    const onFindNextMatch = new EventSource<FindNextMatchEventHandler>("onFindNextMatch");

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

export const BasicUseCase = Template.bind({});

BasicUseCase.args = {
    model: makeModel("const x = 1;"),
    language: "javascript",
    onChange: async (updatedText: string): Promise<void> => {
        console.log(`Text changed:`);
        console.log(updatedText)
    }
};

export const WorkingUseCase = Template.bind({});

WorkingUseCase.args = {
    ...BasicUseCase.args,
    working: true,
};

export const TwoEditorsSameModel = () => {
    const model = makeModel("const x = 1");
    return (
        <div>
            <div className="border border-solid border-red-600">
                <MonacoEditor
                    model={model}
                    language="javascript"
                />
            </div>
            <div className="border border-solid border-red-600">
                <MonacoEditor
                    model={model}
                    language="javascript"
                />
            </div>
        </div>
    );
}

export const TwoEditorsDifferentModel = () => {
    const modelA = makeModel("const x = 1;");
    const modelB = makeModel("const x = 2;");
    return (
        <div>
            <div className="border border-solid border-red-600">
                <MonacoEditor
                    model={modelA}
                    language="javascript"
                />
            </div>
            <div className="border border-solid border-red-600">
                <MonacoEditor
                    model={modelB}
                    language="javascript"
                />
            </div>
        </div>
    );
}