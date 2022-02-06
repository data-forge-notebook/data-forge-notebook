//
// Renders the output of a cell in the notebook.
//

import * as React from 'react';

export interface ICellOutputProps {
}

export interface ICellOutputState {
}

export class CellOutput extends React.Component<ICellOutputProps, ICellOutputState> {

    constructor(props: ICellOutputProps) {
        super(props);

        this.state = {};
    }

    render() {
        return (
            <div>
                Output goes here!
            </div>
        )
    }
}
