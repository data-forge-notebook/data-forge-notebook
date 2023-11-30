import * as React from 'react';

export interface ITextProps {
    //
    // Text to be displayed.
    //
    text?: any;
}

export class Text extends React.Component<ITextProps, {}> {
    
    render () {

        let text = this.props.text;
        if (text !== undefined && typeof(text) !== "string") {
            text = text.toString();
        }

        return (
            <pre
                style={{ 
                    paddingLeft: "24px",
                    paddingTop: "6px",
                    paddingBottom: "32px",
                }}  
                >
                {text}
            </pre>
        );
    }
};