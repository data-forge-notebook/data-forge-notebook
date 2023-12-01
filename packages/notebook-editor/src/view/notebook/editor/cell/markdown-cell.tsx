import * as React from 'react';
import { IMarkdownCellViewModel } from '../../../../view-model/markdown-cell';
import { IMonacoEditorViewModel } from '../../../../view-model/monaco-editor';
import { handleAsyncErrors } from 'utils';
import { forceUpdate } from 'browser-utils';
import { MonacoEditor } from '../../../../components/monaco-editor';
import ReactMarkdown from 'react-markdown';
import { InjectProperty, InjectableClass } from '@codecapers/fusion';
import { ICommander, ICommanderId } from '../../../../services/commander';
import { IOpen, IOpen_ID } from '../../../../services/open';
import { INotebookViewModel } from '../../../../view-model/notebook';

export interface IMarkdownCellProps {
    //
    // The view-model for the markdown cell.
    //
    model: IMarkdownCellViewModel;

    //
    // View model for the notebook.
    //
    notebookModel: INotebookViewModel;
}

export interface IMarkdownCellState {
}

@InjectableClass()
export class MarkdownCellUI extends React.Component<IMarkdownCellProps, IMarkdownCellState> {

    @InjectProperty(ICommanderId)
    commander!: ICommander;

    @InjectProperty(IOpen_ID)
    open!: IOpen;

    constructor (props: any) {
        super(props)
        
        this.state = {};
    }

    componentDidMount() {
        this.props.model.onEditorSelectionChanged.attach(this.onEditorSelectionChanged);
        this.props.model.onModeChanged.attach(this.onModeChanged);
        this.props.model.onTextChanged.attach(this.onTextChanged);
    }

    componentWillUnmount() {
        this.props.model.onEditorSelectionChanged.detach(this.onEditorSelectionChanged);
        this.props.model.onModeChanged.detach(this.onModeChanged);
        this.props.model.onTextChanged.detach(this.onTextChanged);
    }

    private onModeChanged = async (): Promise<void> => {
        await forceUpdate(this);
    }

    async enterPreviewMode(): Promise<void> {
        await this.props.model.enterPreviewMode();
    }

    private onEditorSelectionChanged = async (cell: IMonacoEditorViewModel): Promise<void> => {
        
        if (this.props.model.isSelected()) { //TODO: COULD BE DONE IN THE VIEW MODEL.
            await this.props.model.enterEditMode();
        }
        else {
            await this.enterPreviewMode();
        }

        // Force a render in preview or edit mode so that we can scroll to the element.
        await forceUpdate(this); 
    }

    private onBlur = async (): Promise<void> => {
        // Wait a moment before entering preview mode, this will be suppressed if the find dialog has just been opened.
        setTimeout(() => handleAsyncErrors(() => this.enterPreviewMode()), 500);
    }

    private onMarkdownClick = async (): Promise<void> => {
        await this.props.model.enterEditMode();
    }

    private onEscapeKey = async () => {
        await this.enterPreviewMode();
        await this.props.notebookModel.deselect();
    }

    //
    // Event raised when the text in the view model has changed.
    //
    private onTextChanged = async (): Promise<void> => {
        if (!this.props.model.isEditing()) {
            //
            // When in preview mode and the text has changed, rerender the markdown.
            //
            await forceUpdate(this);
        }
    }

    //
    // Handle a link click in the markdown.
    //
    onLinkClick = async (link: string): Promise<void> => {
        const openExampleLinkPrefix = "http://open-example=";
        const openFileLinkPrefix = "http://open-notebook=";
        const cmdLinkPrefix = "http://command+";
        if (link.startsWith(cmdLinkPrefix)) {
            const cmd = link.substring(cmdLinkPrefix.length);
            await this.commander.invokeNamedCommand(cmd, { cell: this.props.model });
        }
        else if (link.startsWith(openFileLinkPrefix)) {
            await this.commander.invokeNamedCommand("open-notebook", undefined, { file: link.substring(openFileLinkPrefix.length) });
        }
        else if (link.startsWith(openExampleLinkPrefix)) {
            await this.commander.invokeNamedCommand("open-notebook", undefined, { file: link.substring(openFileLinkPrefix.length) });
        }
        else {
            await this.open.openUrl(link);
        }
    }

    render () {
        const inEditMode = this.props.model.isEditing();

        return (
            <div 
                className="cursor-text"
                onBlur={this.onBlur}
                onClick={this.onMarkdownClick}
                >
                {inEditMode
                    ? <div
                        style={{
                            paddingTop: "24px",
                            paddingRight: "8px",
                            paddingBottom: "24px",
                        }}
                        >
                        <MonacoEditor
                            language="markdown"
                            model={this.props.model} 
                            onEscapeKey={this.onEscapeKey}
                            />
                    </div>
                    : <div
                        style={{
                            paddingTop: "12px",
                            paddingLeft: "16px",
                        }}
                        >
                        <ReactMarkdown
                            children={this.props.model.getText()} 
                            components={{
                                a: (props: any) => {
                                    return (
                                        <a 
                                            onClick={async e => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                await this.onLinkClick(props.href);
                                            }}
                                            >
                                            {props.children}
                                        </a>
                                    );
                                },
                            }}
                            />
                    </div>
                }
            </div>
        );
    }
}
