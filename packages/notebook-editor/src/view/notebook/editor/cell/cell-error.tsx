//
// Displays an error from a code cell.
//

import * as React from 'react';
import styled from 'styled-components';

export interface ICellErrorProps {
    msg: string;
}

const ErrorBorder = styled.div`
    border: 1px dashed rgba(255, 0, 0, 0.6);
    border-top: none;
    color: red;
    padding: 8px;
    user-select: text;
`;

export class CellErrorUI extends React.Component<ICellErrorProps, {}> {

    render () {
        return (
            <ErrorBorder>
                <pre>
                    {this.props.msg}
                </pre>
            </ErrorBorder>
        );
    }
}

