import * as React from 'react';
import { IMarkdownCellViewModel } from '../../../../view-model/markdown-cell';
import { handleAsyncErrors } from 'utils';
import { MonacoEditor } from '../../../../components/monaco-editor';
import ReactMarkdown from 'react-markdown';
import { InjectProperty, InjectableClass } from '@codecapers/fusion';
import { ICommander, ICommanderId } from '../../../../services/commander';
import { IOpen, IOpen_ID } from '../../../../services/open';
import { INotebookViewModel } from '../../../../view-model/notebook';
import { ICellViewModel } from '../../../../view-model/cell';
import { observer } from 'mobx-react';

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
class MarkdownCellUIView extends React.Component<IMarkdownCellProps, IMarkdownCellState> {

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
    }

    componentWillUnmount() {
        this.props.model.onEditorSelectionChanged.detach(this.onEditorSelectionChanged);
    }

    async enterPreviewMode(): Promise<void> {
        await this.props.model.enterPreviewMode();
    }

    private onEditorSelectionChanged = async (cell: ICellViewModel): Promise<void> => {
        if (this.props.model.selected) {
            await this.props.model.enterEditMode();
        }
        else {
            await this.enterPreviewMode();
        }
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
        const inEditMode = this.props.model.editing;

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
                            cell={this.props.model} 
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
                            children={this.props.model.text} 
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

export const MarkdownCellUI = observer(MarkdownCellUIView);