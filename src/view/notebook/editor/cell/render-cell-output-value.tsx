//
// Format a value for display.
//
import * as React from 'react';
import { General } from './output/general';
import { ICellOutputValueViewModel } from '../../../../view-model/cell-output-value';

//
// Format cell output for display.
//
export function renderCellOutputValue(outputValue: ICellOutputValueViewModel): JSX.Element {

    //TODO: Need to render the output plugin here.

    // Default.
    return <General value={outputValue.getData().toString()} />;
}