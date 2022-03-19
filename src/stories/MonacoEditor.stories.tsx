import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';

import { MonacoEditor } from '../components/monaco-editor';

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


export const TwoEditorsSameModel = () => (
    <div>
        <div className="border border-solid border-red-600">
            <MonacoEditor 
                id="AAAA"
                text={"const x = 1;"}
                language="javascript"
                />
        </div>
        <div className="border border-solid border-red-600">
            <MonacoEditor 
                id="AAAA"
                text={"const x = 2;"}
                language="javascript"
                />
        </div>
    </div>
);