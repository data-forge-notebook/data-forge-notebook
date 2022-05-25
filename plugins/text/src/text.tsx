import * as React from 'react';

export interface ITextProps {
    //
    // Text to be displayed.
    //
    text?: string;
}

export class Text extends React.Component<ITextProps, {}> {
    
    render () {
        let text = this.props.text;
        if (this.props.text !== undefined && typeof(this.props.text) !== "string") {
            text = JSON.stringify(text, null, 4);
        }

        return (
            <pre
                style={{ 
                    marginTop: "0px",
                    marginBottom: "0px",
                    paddingTop: "12px",
                    paddingBottom: "12px",
                }}  
                >
                {this.props.text}
            </pre>
        );
    }
};