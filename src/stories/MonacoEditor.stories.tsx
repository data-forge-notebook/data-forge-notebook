import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';

import { MonacoEditor } from '../components/monaco-editor';
import { EventSource, BasicEventHandler } from '../lib/event-source';
import { FindNextMatchEventHandler, FocusedEventHandler, ReplaceTextEventHandler, SelectionChangedEventHandler, SelectTextEventHandler, SetCaretPositionEventHandler } from '../view-model/monaco-editor';

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

export const BasicUseCase = Template.bind({});

BasicUseCase.args = {
  text: "async function hello() {\n}\n\nawait hello();\n\nconst x = 5;\n\nconst x = 3;",
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

function makeModel(text: string): any {

    const onCodeChanged = new EventSource<BasicEventHandler>("onCodeChanged");
    const onSetFocus = new EventSource<FocusedEventHandler>("onSetFocus");
    const onSetCaretPosition = new EventSource<SetCaretPositionEventHandler>("onSetCaretPosition");
    const onSelectionChanging = new EventSource<SelectionChangedEventHandler>("onSelectionChanging");
    const onSelectionChanged = new EventSource<SelectionChangedEventHandler>("onSelectionChanged");
    const onSelectText = new EventSource<SelectTextEventHandler>("onSelectText");
    const onDeselectText = new EventSource<BasicEventHandler>("onDeselectText");
    const onReplaceText = new EventSource<ReplaceTextEventHandler>("onReplaceText");
    const onFlushChanges = new EventSource<BasicEventHandler>("onFlushChanges");
    const onFindNextMatch = new EventSource<FindNextMatchEventHandler>("onFindNextMatch");

    const model: any = {
        getCode: () => {
            return text;
        },

        setCode: async (_text: string): Promise<void> => {
            text = _text;;
            await onCodeChanged.raise();
        },
    
        setSelectedText: () => {
        },

        setCaretOffset: () => {

        },

        setSelectedTextRange: () => {

        },

        onCodeChanged,
        onSetFocus,
        onSetCaretPosition,
        onSelectionChanging,
        onSelectionChanged,
        onSelectText,
        onDeselectText,
        onReplaceText,
        onFlushChanges,
        onFindNextMatch,
    };
    return model;
}


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