//
// Displays an error from a code cell.
//

import * as React from 'react';
import styled from 'styled-components';

export interface ICellErrorProps {
    msg: string;
}

export class CellErrorUI extends React.Component<ICellErrorProps, {}> {

    render () {
        const ErrorBorder = styled.div`
            border: 1px dashed rgba(255, 0, 0, 0.6);
            border-top: none;
            color: red;
            padding: 8px;
            user-select: text;
        `;

        return (
            <ErrorBorder>
                {this.props.msg
                    .split("\n")
                    .map((line, index) => 
                        <div key={index}>
                            {line.trim()}
                        </div>
                )}
            </ErrorBorder>
        );
    }
}

