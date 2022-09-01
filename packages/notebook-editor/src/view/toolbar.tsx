import { ButtonGroup, Icon, Popover, PopoverInteractionKind, PopoverPosition, Position, Spinner } from '@blueprintjs/core';
import { InjectableClass, InjectProperty } from '@codecapers/fusion';
import { forceUpdate } from 'browser-utils';
import * as React from 'react';
import { asyncHandler } from 'utils';
import { ICommander, ICommanderId } from '../services/commander';
import { IPlatform, IPlatformId } from '../services/platform';
import { INotebookEditorViewModel } from '../view-model/notebook-editor';
import { makeButton } from './make-button';

const FPSStats = require("react-fps-stats").default;

export interface IToolbarProps {
    model: INotebookEditorViewModel;
}

export interface IToolbarState {
}

@InjectableClass()
export class Toolbar extends React.Component<IToolbarProps, IToolbarState> {

    @InjectProperty(ICommanderId)
    commander!: ICommander;
    
    @InjectProperty(IPlatformId)
    platform!: IPlatform;

    constructor (props: IToolbarProps) {
        super(props);

        this.state = {
        };

        this.componentDidMount = asyncHandler(this, this.componentDidMount);
        this.onOpenNotebookWillChange = this.onOpenNotebookWillChange.bind(this);
        this.onOpenNotebookChanged = this.onOpenNotebookChanged.bind(this);
        this.onCodeEvalStarted = this.onCodeEvalStarted.bind(this);
        this.onCodeEvalCompleted = this.onCodeEvalCompleted.bind(this);
        this.onNotebookModified = this.onNotebookModified.bind(this);
    }

    async componentDidMount() {
        this.props.model.onOpenNotebookWillChange.attach(this.onOpenNotebookWillChange);
        this.props.model.onOpenNotebookChanged.attach(this.onOpenNotebookChanged);
        this.props.model.onModified.attach(this.onNotebookModified);
        
        this.hookNotebookEvents();
    }

    componentWillUnmount(): void {
        this.props.model.onOpenNotebookWillChange.detach(this.onOpenNotebookWillChange);
        this.props.model.onOpenNotebookChanged.detach(this.onOpenNotebookChanged);
        this.props.model.onModified.detach(this.onNotebookModified);

        this.unhookNotebookEvents();
    }

    hookNotebookEvents(): void {
        if (this.props.model.isNotebookOpen()) {
            const notebook = this.props.model.getOpenNotebook();
            notebook.onEvalStarted.attach(this.onCodeEvalStarted);
            notebook.onEvalCompleted.attach(this.onCodeEvalCompleted);
        }
    }

    unhookNotebookEvents(): void {
        if (this.props.model.isNotebookOpen()) {
            const notebook = this.props.model.getOpenNotebook();
            notebook.onEvalStarted.detach(this.onCodeEvalStarted);
            notebook.onEvalCompleted.detach(this.onCodeEvalCompleted);
        }
    }

    private async onOpenNotebookWillChange(): Promise<void> {
        this.unhookNotebookEvents();
    }

    private async onOpenNotebookChanged(): Promise<void> {
        this.hookNotebookEvents();
    }

    private async onCodeEvalStarted() {
        await forceUpdate(this);
    }

    private async onCodeEvalCompleted() {
        await forceUpdate(this);
    }

    private async onNotebookModified() {
        await forceUpdate(this);
    }

    render(): JSX.Element {
        const isNotebookOpen = this.props.model.isNotebookOpen();
        const notebook = this.props.model.isNotebookOpen() && this.props.model.getOpenNotebook() || undefined;
        const isExecuting = notebook && notebook.isExecuting() || false;
        let language = notebook && notebook.getLanguage();
        if (language === "javascript") {
            language = "JavaScript";
        }
        else if (language === "typescript") {
            language = "TypeScript";
        }

        return (
            <div 
                style={{
                    paddingTop: "8px",
                    paddingBottom: "6px",
                    backgroundColor: "#FAFAFA",
                    borderBottom: "1px solid #DEDEDE",
                }}
                >
                <div 
                    className="flex flex-row items-center centered-container"
                    >

                    {isNotebookOpen
                        && <ButtonGroup>
                            {makeButton(this.commander, "eval-notebook", 
                                { 
                                    pos: Position.BOTTOM,
                                }, 
                                this.platform,
                                { 
                                    notebook                                         
                                }, 
                                isExecuting ? "executing" : "notExecuting"
                            )}
                        </ButtonGroup>
                    }

                    <ButtonGroup className="ml-2">
                        {makeButton(this.commander, "new-notebook", { pos: Position.BOTTOM }, this.platform)}
                        {makeButton(this.commander, "open-notebook", { pos: Position.BOTTOM }, this.platform)}
                        {isNotebookOpen &&
                            makeButton(this.commander, "reload-notebook", { pos: Position.BOTTOM }, this.platform)
                        }
                        {isNotebookOpen
                            && makeButton(this.commander, "save-notebook", { pos: Position.BOTTOM }, this.platform)
                        }
                    </ButtonGroup>
                    
                    {this.props.model.isNotebookOpen()
                        && <ButtonGroup className="ml-2">
                            {makeButton(this.commander, "undo", { pos: Position.BOTTOM }, this.platform)}
                            {makeButton(this.commander, "redo", { pos: Position.BOTTOM }, this.platform)}
                        </ButtonGroup>
                    }

                    {makeButton(this.commander, "toggle-hotkeys", { pos: Position.BOTTOM }, this.platform)}

                    <span className="flex-grow ml-2" />

                    {language 
                        && <div
                            className="flex flex-row items-center ml-2"
                            style={{
                                fontSize: "0.8em"
                            }}
                            >
                            {language}
                        </div>
                    }

                    <div 
                        className="flex flex-row items-center justify-center ml-3"
                        >
                        <Popover
                            autoFocus={false}
                            interactionKind={PopoverInteractionKind.HOVER}
                            hoverOpenDelay={50}
                            hoverCloseDelay={1000}
                            usePortal={false}
                            position={PopoverPosition.BOTTOM}
                            content={(
                                <div
                                    style={{
                                        padding: "5px",
                                    }}
                                    >
                                    {isExecuting ? "Evaluating notebook" : "Idle"}
                                </div>
                            )}
                            >
                            <div
                                style={{
                                    outline: "none",
                                    cursor: "pointer",
                                    paddingTop: "2.5px",
                                    width: "20px",
                                    height: "20px",
                                }}
                                >
                                {isExecuting
                                    && <Spinner
                                        size={15}
                                        />
                                    || <div
                                        className="flex flex-col items-center justify-center"
                                        style ={{
                                            marginTop: "4px",
                                        }}
                                        >
                                        <Icon icon="link" />
                                    </div>
                                }
                            </div>
                        </Popover>
                    </div>
                    
                    <FPSStats 
                        top="auto"
                        left="auto"
                        right={0}
                        bottom={0}
                        />

                </div>

            </div>
        )
    }
}

