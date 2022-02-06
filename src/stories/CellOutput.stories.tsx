import React from 'react';

import { ComponentStory, ComponentMeta } from '@storybook/react';

import { CellOutput } from '../notebook/cell/output/cell-output';

export default {
  title: 'Cell Output',
  component: CellOutput,
} as ComponentMeta<typeof CellOutput>;

//👇 We create a “template” of how args map to rendering
const Template: ComponentStory<typeof CellOutput> = (args) => <CellOutput {...args} />;

export const FirstStory = Template.bind({});

FirstStory.args = {
  /*👇 The args you need here will depend on your component */
};
