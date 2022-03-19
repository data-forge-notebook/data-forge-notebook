import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { NotebookEditor } from '..';

export default {
  title: 'Notebook Editor',
  component: NotebookEditor,
} as ComponentMeta<typeof NotebookEditor>;

export const NotebookEditorData = () => 
    <NotebookEditor
        />