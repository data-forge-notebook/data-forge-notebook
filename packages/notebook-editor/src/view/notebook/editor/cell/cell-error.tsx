//
// Displays an error from a code cell.
//

import * as React from 'react';

export interface ICellErrorProps {
    msg: string;
}

export class CellErrorUI extends React.Component<ICellErrorProps, {}> {

    render () {
        return (
            <div className="error-border">
                <pre>
                    {this.props.msg}
                </pre>
            </div>
        );
    }
}

