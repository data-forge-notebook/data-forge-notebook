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
const Template: ComponentStory<typeof MonacoEditor> = (args) => <MonacoEditor {...args} />;

export const BasicUseCase = Template.bind({});

BasicUseCase.args = {
  /*👇 The args you need here will depend on your component */
};
