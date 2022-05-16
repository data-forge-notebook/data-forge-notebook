import React from 'react';
import { marked } from 'marked';

export interface IMarkdownProps {
    //
    // Markdown text to render.
    //
    source: string;

    //
    // Minimum height for the markdown renderer.
    //
    minHeight: number;
}

export interface IMarkdownState {

}

export default class Markdown extends React.Component<IMarkdownProps, IMarkdownState> {

    render() {
        return (
            <div 
                style={{
                    minHeight: `${this.props.minHeight}px`,
                }}
                dangerouslySetInnerHTML={{ __html: marked(this.props.source || '') }} 
                />
        );
    }
}