import React from 'react';
import { ComponentMeta } from '@storybook/react';
import { PluggableCellOutput } from '../notebook/cell/output/pluggable-cell-output';

export default {
  title: 'Cell Output',
  component: PluggableCellOutput,
} as ComponentMeta<typeof PluggableCellOutput>;

export const StructuredData = () => 
    <PluggableCellOutput
        config={{
            data: {
                some: "data",
                array: [1, 2, 3],
            },
        }}
        />