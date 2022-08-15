import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { NotebookEditor, NotebookEditorViewModel, NotebookViewModel } from 'notebook-editor';
import * as testNotebook from "./test-notebook.json";

export default {
  title: 'Notebook Editor',
  component: NotebookEditor,
} as ComponentMeta<typeof NotebookEditor>;

const mockId: any = {};
const notebookViewModel = NotebookViewModel.deserialize(mockId, false, false, "v16", testNotebook as any);
const notebookEditorViewModel = new NotebookEditorViewModel(notebookViewModel);

export const NotebookEditorData = () => 
    <NotebookEditor
        model={notebookEditorViewModel}
        />