import * as React from 'react';

export interface ITextProps {
    //
    // Text to be displayed.
    //
    text?: string;
}

export class Text extends React.Component<ITextProps, {}> {
    
    render () {
        if (this.props.text !== undefined && typeof(this.props.text) !== "string") {
            return (
                <pre>
                    {JSON.stringify(this.props.text, null, 4)}
                </pre>
            );
        }

        return (
            <pre>
                {this.props.text}
            </pre>
        );
    }
};