import * as React from 'react';

export interface ITextProps {
    //
    // HTML to be displayed.
    //
    html?: string;
}

export class Html extends React.Component<ITextProps, {}> {
    
    render () {

        const src = "data:text/html;charset=utf-8," + encodeURIComponent(this.props.html || "");
        return (
            <iframe 
                style={{
                    height: "100%",
                    pointerEvents: "none",
                }}
                src={src}
                sandbox="allow-scripts"
                />
        );
    }
};