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
                    width: "100%",
                    height: "100vh",
                    pointerEvents: "none",
                }}
                src={src}
                sandbox="allow-scripts"
                />
        );
    }
};