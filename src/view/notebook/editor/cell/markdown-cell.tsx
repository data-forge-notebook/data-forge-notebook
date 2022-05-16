import * as React from 'react';
import { IMarkdownCellViewModel } from '../../../../view-model/markdown-cell';
import { IMonacoEditorViewModel } from '../../../../view-model/monaco-editor';
import { asyncHandler, handleAsyncErrors } from '../../../../lib/async-handler';
import { forceUpdate } from '../../../../lib/force-update';
import { MonacoEditor } from '../../../../components/monaco-editor';
import Markdown from '../../../../components/markdown';

const MIN_HEIGHT = 46;

export interface IMarkdownCellProps {
    //
    // The view-model for the markdown cell.
    //
    model: IMarkdownCellViewModel;

    //
    // Callback to update cell height.
    //
    onHeightChanged: () => void;
}

export interface IMarkdownCellState {
}

export class MarkdownCellUI extends React.Component<IMarkdownCellProps, IMarkdownCellState> {

    //
    // The HTML element that contains the rendered markdown
    //
    markdownElement: React.RefObject<HTMLDivElement>;

    //
    // Sets the min height of the text editor based on the height of the markdown preview element.
    //
    minTextEditorHeight: number | undefined = undefined;

    constructor (props: any) {
        super(props)
        
        this.markdownElement = React.createRef<HTMLDivElement>();

        this.state = {};

        this.onBlur = asyncHandler(this, this.onBlur);
        this.onMarkdownClick = asyncHandler(this, this.onMarkdownClick);
        this.onEditorSelectionChanged = asyncHandler(this, this.onEditorSelectionChanged);
        this.onModeChanged = asyncHandler(this, this.onModeChanged);
        this.onEscapeKey = asyncHandler(this, this.onEscapeKey);
    }

    componentDidMount() {
        this.props.model.onEditorSelectionChanged.attach(this.onEditorSelectionChanged);
        this.props.model.onModeChanged.attach(this.onModeChanged);
    }

    componentWillUnmount() {
        this.props.model.onEditorSelectionChanged.detach(this.onEditorSelectionChanged);
        this.props.model.onModeChanged.detach(this.onModeChanged);
    }

    async onModeChanged(): Promise<void> {
        await forceUpdate(this);
        this.props.onHeightChanged();
    }

    async enterPreviewMode(): Promise<void> {
        this.minTextEditorHeight = undefined;
        await this.props.model.enterPreviewMode();
    }

    async onEditorSelectionChanged(cell: IMonacoEditorViewModel): Promise<void> {
        
        if (this.props.model.isSelected()) { //TODO: COULD BE DONE IN THE VIEW MODEL.
            await this.props.model.enterEditMode();
        }
        else {
            await this.enterPreviewMode();
        }

        // Force a render in preview or edit mode so that we can scroll to the element.
        await forceUpdate(this); 
    }

    private async onBlur(): Promise<void> {
        // Wait a moment before entering preview mode, this will be suppressed if the find dialog has just been opened.
        setTimeout(() => handleAsyncErrors(() => this.enterPreviewMode()), 500);
    }

    private async onMarkdownClick(): Promise<void> {
        await this.props.model.enterEditMode();
    }

    async onEscapeKey() {
        await this.enterPreviewMode();
    }
    
    render () {
        const inEditMode = this.props.model.isEditing();
        if (inEditMode) {
            if (this.markdownElement.current) {
                if (this.minTextEditorHeight === undefined) {
                    this.minTextEditorHeight = Math.max(MIN_HEIGHT, this.markdownElement.current.offsetHeight);
                }
            }
        }

        const style: any = {
            minHeight: `${MIN_HEIGHT}px`,
        };

        if (this.minTextEditorHeight !== undefined) {
            style.height = `${this.minTextEditorHeight}px`;
        }

        return (
            <div 
                className="cursor-text"
                onBlur={this.onBlur}
                ref={this.markdownElement}
                style={style}
                onClick={this.onMarkdownClick}
                >
                {inEditMode
                    ? <div
                        style={{
                            paddingTop: "16px",
                            paddingRight: "8px",
                            paddingBottom: "16px", 
                        }}
                        >
                        <MonacoEditor
                            language="markdown"
                            model={this.props.model} 
                            onEscapeKey={this.onEscapeKey}
                            onHeightChanged={(newHeight) => {
                                if (this.minTextEditorHeight !== undefined && 
                                    newHeight > this.minTextEditorHeight) {
                                    this.minTextEditorHeight = undefined;
                                    this.markdownElement.current!.style.height = "auto";
                                }
                                this.props.onHeightChanged();
                            }}
                            />
                    </div>
                    : <div
                        style={{
                            paddingLeft: "16px",
                            paddingTop: "2px",
                            paddingBottom: "6px",
                        }}
                        >
                        <Markdown
                            source={this.props.model.getText()} 
                            minHeight={MIN_HEIGHT}
                            />
                    </div>
                }
            </div>
        );
    }
}
