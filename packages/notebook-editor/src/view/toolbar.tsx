import { Button, ButtonGroup, Icon, Menu, MenuItem, Popover, PopoverInteractionKind, PopoverPosition, Position, Spinner, Tooltip } from '@blueprintjs/core';
import { InjectableClass, InjectProperty } from '@codecapers/fusion';
import * as React from 'react';
import { ICommander, ICommanderId } from '../services/commander';
import { IPlatform, IPlatformId } from '../services/platform';
import { INotebookEditorViewModel } from '../view-model/notebook-editor';
import { BUTTON_TOOLTIP_DELAY, makeButton } from './make-button';
import { makeMenuItem } from './make-menu';
import { IZoom, IZoomId } from '../services/zoom';
import { IEvaluatorClient, IEvaluatorId } from '../services/evaluator-client';
import { observer } from 'mobx-react';

const FPSStats = require("react-fps-stats").default;

export interface IToolbarProps {
    notebookEditor: INotebookEditorViewModel;
}

export interface IToolbarState {
}

@InjectableClass()
class ToolbarView extends React.Component<IToolbarProps, IToolbarState> {

    @InjectProperty(ICommanderId)
    commander!: ICommander;
    
    @InjectProperty(IPlatformId)
    platform!: IPlatform;

    @InjectProperty(IZoomId)
    zoom!: IZoom;

    @InjectProperty(IEvaluatorId)
    evaluator!: IEvaluatorClient;

    constructor (props: IToolbarProps) {
        super(props);

        this.state = {};
    }

    render(): JSX.Element {
        const notebookEditor = this.props.notebookEditor;
        const notebook = notebookEditor.notebook || undefined;

        let jobNames = [];

        if (notebookEditor.installing) {
            jobNames.push("Installing notebook");
        }

        if (notebookEditor.evaluating) {
            jobNames.push("Evaluating notebook");
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

                    {notebook
                        && <ButtonGroup>
                            {makeButton(this.commander, "eval-notebook", 
                                { 
                                    pos: Position.BOTTOM,
                                }, 
                                this.platform,
                                { 
                                    notebook
                                }, 
                                notebookEditor.evaluating ? "executing" : "notExecuting"
                            )}
                        </ButtonGroup>
                    }

                    <ButtonGroup className="ml-2">
                        {makeButton(this.commander, "new-notebook", { pos: Position.BOTTOM }, this.platform)}
                        {makeButton(this.commander, "open-notebook", { pos: Position.BOTTOM }, this.platform)}
                        {notebook &&
                            makeButton(this.commander, "reload-notebook", { pos: Position.BOTTOM }, this.platform)
                        }
                        {notebook
                            && makeButton(this.commander, "save-notebook", { pos: Position.BOTTOM }, this.platform)
                        }
                    </ButtonGroup>
                    
                    {notebook
                        && <ButtonGroup className="ml-2">
                            {makeButton(this.commander, "undo", { pos: Position.BOTTOM }, this.platform)}
                            {makeButton(this.commander, "redo", { pos: Position.BOTTOM }, this.platform)}
                        </ButtonGroup>
                    }

                    {notebook
                        && <Popover
                            className="ml-2"
                            autoFocus={false}
                            usePortal={false}
                            position={PopoverPosition.BOTTOM}
                            content={
                                <Menu>
                                    <MenuItem text="Insert above">
                                        {makeMenuItem(this.commander, "insert-code-cell-above", this.platform, { notebook })}
                                        {makeMenuItem(this.commander, "insert-markdown-cell-above", this.platform, { notebook })}
                                    </MenuItem>
                                    <MenuItem text="Insert below">
                                        {makeMenuItem(this.commander, "insert-code-cell-below", this.platform, { notebook })}
                                        {makeMenuItem(this.commander, "insert-markdown-cell-below", this.platform, { notebook })}
                                    </MenuItem>
                                </Menu>
                            } 
                            >
                            <Button
                                icon="plus"
                                small
                                minimal
                                />
                        </Popover>
                    }

                    <ButtonGroup className="ml-2">
                        {makeButton(this.commander, "toggle-hotkeys", { pos: Position.BOTTOM }, this.platform)}
                        {makeButton(this.commander, "toggle-recent-file-picker", { pos: Position.BOTTOM }, this.platform)}
                        {makeButton(this.commander, "toggle-examples-browser", { pos: Position.BOTTOM }, this.platform)}
                        {makeButton(this.commander, "toggle-command-palette", { pos: Position.BOTTOM }, this.platform)}
                    </ButtonGroup>

                    {notebook
                        &&<ButtonGroup className="ml-2">
                            {makeButton(this.commander, "clear-outputs", { pos: Position.BOTTOM }, this.platform)}
                        </ButtonGroup>
                    }

                    <ButtonGroup className="ml-2">
                        <Tooltip
                            content="Resets the zoom level to default"
                            hoverOpenDelay={BUTTON_TOOLTIP_DELAY}
                            >
                            <Button
                                small
                                minimal
                                icon="zoom-to-fit"
                                onClick={() => this.zoom.resetZoom()}
                                >
                            </Button>
                        </Tooltip>
                        <Tooltip
                            content="Zooms out to see more of your notebook"
                            hoverOpenDelay={BUTTON_TOOLTIP_DELAY}
                            >
                            <Button
                                className="ml-1"
                                small
                                minimal
                                icon="zoom-out"
                                onClick={() => this.zoom.zoomOut()}
                                >
                            </Button>
                        </Tooltip>
                        <Tooltip
                            content="Zooms in your notebook to make the test and graphics larger"
                            hoverOpenDelay={BUTTON_TOOLTIP_DELAY}
                            >
                            <Button
                                small
                                minimal
                                icon="zoom-in"
                                onClick={() => this.zoom.zoomIn()}
                                >
                            </Button>
                        </Tooltip>
                    </ButtonGroup>

                    {notebook
                        &&<ButtonGroup className="ml-2">
                            {makeButton(this.commander, "split-cell", { pos: Position.BOTTOM }, this.platform)}
                            {makeButton(this.commander, "merge-cell-up", { pos: Position.BOTTOM }, this.platform)}
                            {makeButton(this.commander, "merge-cell-down", { pos: Position.BOTTOM }, this.platform)}
                            {makeButton(this.commander, "duplicate-cell", { pos: Position.BOTTOM }, this.platform)}
                        </ButtonGroup>
                    }

                    {notebook
                        &&<ButtonGroup className="ml-2">
                            {makeButton(this.commander, "focus-top-cell", { pos: Position.BOTTOM }, this.platform)}
                            {makeButton(this.commander, "focus-prev-cell", { pos: Position.BOTTOM }, this.platform)}
                            {makeButton(this.commander, "focus-next-cell", { pos: Position.BOTTOM }, this.platform)}
                            {makeButton(this.commander, "focus-bottom-cell", { pos: Position.BOTTOM }, this.platform)}
                        </ButtonGroup>
                    }
                    
                    <span className="flex-grow ml-2" />

                    <div 
                        className="flex flex-row items-center justify-center ml-3"
                        >
                        <Popover
                            autoFocus={false}
                            interactionKind={PopoverInteractionKind.HOVER}
                            hoverOpenDelay={50}
                            hoverCloseDelay={1000}
                            usePortal={false}
                            position={PopoverPosition.BOTTOM_RIGHT}
                            content={(
                                <div
                                    style={{
                                        padding: "5px",
                                    }}
                                    >
                                    {jobNames.length > 0
                                        ? jobNames.join(", ")
                                        : "Idle"
                                    }
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
                                {jobNames.length > 0
                                    && <Spinner
                                        size={15}
                                        />
                                    || <div
                                        className="flex flex-col items-center justify-center"
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

export const Toolbar = observer(ToolbarView);