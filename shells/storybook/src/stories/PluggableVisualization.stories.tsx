import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { PluggableVisualization } from 'notebook-editor/build/view/notebook/editor/cell/pluggable-visualization';

export default {
  title: 'Pluggable visualization',
  component: PluggableVisualization,
} as ComponentMeta<typeof PluggableVisualization>;

export const VisualizeStructuredData = () => 
    <PluggableVisualization
        pluginRequest={{
            data: {
                some: "data",
                array: [1, 2, 3],
            },
        }}
        />