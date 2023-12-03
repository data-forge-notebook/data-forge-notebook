import * as React from 'react';
import { CodeCellUI } from './code-cell';
import { MarkdownCellUI } from './markdown-cell';
import { ICellViewModel } from '../../../../view-model/cell';
import { ICodeCellViewModel } from '../../../../view-model/code-cell';
import { IMarkdownCellViewModel } from '../../../../view-model/markdown-cell';
import * as _ from 'lodash';
import { DraggableProvidedDragHandleProps } from 'react-beautiful-dnd';
import { INotebookViewModel } from '../../../../view-model/notebook';
import { CellHandle } from './cell-handle';
import { throttleAsync } from 'utils';
import { isElementPartiallyInViewport } from 'browser-utils';
import { CellType } from 'model';
import { makeButton } from '../../../make-button';
import { InjectProperty, InjectableClass } from '@codecapers/fusion';
import { ICommander, ICommanderId } from '../../../../services/commander';
import { Position } from '@blueprintjs/core';
import { IPlatform, IPlatformId } from '../../../../services/platform';
import { observer } from 'mobx-react';
const classnames = require("classnames");

export interface ICellProps {

    //
    // The language of the code cell.
    //
    language: string;

    //
    // The model for the cell.
    //
    cell: ICellViewModel;

    //
    // The model for the notebook.
    //
    notebook: INotebookViewModel;

    //
    // Props for a draggable cell.
    //
    dragHandleProps: DraggableProvidedDragHandleProps | undefined;
}

export interface ICellState {
}

@InjectableClass()
@observer
export class CellUI extends React.Component<ICellProps, ICellState> {

    @InjectProperty(ICommanderId)
    commander!: ICommander;

    @InjectProperty(IPlatformId)
    platform!: IPlatform;

    //
    // The HTML element that contains the cell.
    //
    cellContainerElement: React.RefObject<HTMLDivElement>;

    //
    // Inner cell container, not dependent on the height of the cell handle.
    // 
    innerCellContainerElement: React.RefObject<HTMLDivElement>;
    
    constructor (props: any) {
        super(props)

        this.state = {};

        this.cellContainerElement = React.createRef<HTMLDivElement>();
        this.innerCellContainerElement = React.createRef<HTMLDivElement>();
    }

    componentDidMount() {
        this.props.cell.onScrollIntoView.attach(this.onScrollIntoView);
    }

    componentWillUnmount() {
        this.props.cell.onScrollIntoView.detach(this.onScrollIntoView);
    }

    private onCellFocused = async (): Promise<void> => {
        // Automatically select cell when focused.
        await this.props.cell.select();
    }

    //
    // Scroll the notebook so the cell is visible.
    //
    private onScrollIntoView = async (scrollReason: string): Promise<void> => {
        const element = this.cellContainerElement.current;
        if (element) {
            if (!isElementPartiallyInViewport(element, 0)) {

                //
                // The animated scrolling isn't reliable!
                //
                // The -90 here is to account for the sticky toolbar.
                // Would like to find a different way to do this!
                document.documentElement.scrollTop = element.getBoundingClientRect().top + document.documentElement.scrollTop - 90;
                
                // element.scrollIntoView({
                //     block: "start", 
                //     inline: "nearest", 
                //     behavior: "smooth",
                // });

                // const scrollOffset = element.getBoundingClientRect().top + document.documentElement.scrollTop;
                // this.log.info("Scrolling to: " + scrollOffset);
                // window.scroll({
                //     top: scrollOffset,
                //     behavior: "smooth",
                // });    
            }
        }
    }

    //
    // Return the particular type of cell.
    //
    private renderCellType(): JSX.Element { //TODO: Can the cell type be some kind of plugin, instead of being hard coded?
        const cellType = this.props.cell.cellType;
        if (cellType === CellType.Code) {
            return (
                <CodeCellUI 
                    language={this.props.language}
                    cell={this.props.cell as ICodeCellViewModel} 
                    notebook={this.props.notebook}
                    />
            );
        }
        else if (cellType === CellType.Markdown) {
            return (
                <MarkdownCellUI 
                    model={this.props.cell as IMarkdownCellViewModel} 
                    notebookModel={this.props.notebook}
                    />
            );
        }
        else {
            throw new Error("Unknown cell type!");
        }
    }

    render () {
        const canExecute = this.props.cell.cellType === CellType.Code;
        const notebookExecuting = this.props.notebook.executing;
        const isSelected = this.props.cell.selected;

        return (
            <div 
                ref={this.cellContainerElement}
                onFocus={this.onCellFocused}
                >
                <div 
                    className="centered-container cell-container pos-relative"
                    >
                    <div
                        className="pointer-events-none"
                        style={{ 
                            position: "absolute", 
                            left: 0, 
                            right: 0, 
                            top: 0, 
                            bottom: 0, 
                            zIndex: 10,
                        }}
                        >
                        {isSelected &&
                            <div className="pointer-events-auto">
                                <div
                                    className="flex flex-col items-start" 
                                    style={{ 
                                        position: "absolute", 
                                        top: 3, 
                                        bottom: 0, 
                                        left: "calc(100% - 10px)",
                                    }}
                                    >
                                    <div>
                                        {makeButton(this.commander, "move-cell-up", { pos: Position.LEFT }, this.platform, { cell: this.props.cell })}
                                    </div>

                                    <div>
                                        {makeButton(this.commander, "move-cell-down", { pos: Position.LEFT }, this.platform, { cell: this.props.cell })}
                                    </div>

                                    <div className="mt-4">
                                        {makeButton(this.commander, "delete-cell", { pos: Position.LEFT, intent: "danger" }, this.platform, { cell: this.props.cell })}
                                    </div>
                                </div>

                                <div>
                                    <div 
                                        className="flex flex-col items-end"
                                        style={{ 
                                            position: "absolute", 
                                            top: 3, 
                                            bottom: 0,
                                            right: "calc(100% + 15px)",
                                        }}
                                        >
                                        <div>
                                            {canExecute 
                                                && makeButton(this.commander, "eval-to-cell", {}, this.platform, { cell: this.props.cell }, notebookExecuting ? "executing" : "notExecuting")
                                            }
                                        </div>

                                        <div>
                                            {canExecute 
                                                && makeButton(this.commander, "eval-single-cell", {}, this.platform, { cell: this.props.cell }, notebookExecuting ? "executing" : "notExecuting")
                                            }
                                        </div>

                                        <div className="flex-grow" />

                                        <div className="mb-1 flex flex-row">
                                            <div>
                                                {makeButton(this.commander, "insert-markdown-cell-below", { 
                                                        pos: Position.BOTTOM, 
                                                    }, 
                                                    this.platform,
                                                    { cell: this.props.cell }
                                                )}
                                            </div>

                                            <div>
                                                {makeButton(this.commander, "insert-code-cell-below", { 
                                                        pos: Position.BOTTOM, 
                                                    }, 
                                                    this.platform, 
                                                    { cell: this.props.cell }
                                                )}
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
                        }
                    </div>

                    <div className="relative">
                        <CellHandle
                            cell={this}
                            model={this.props.cell}
                            cellContainerElement={this.innerCellContainerElement}
                            isSelected={isSelected}
                            dragHandleProps={this.props.dragHandleProps}
                            />

                        <div 
                            ref={this.innerCellContainerElement}
                            className={classnames(
                                "cell-border",
                                "inline-block", 
                                "align-top",
                                this.props.cell.cellType,
                                {
                                    focused: isSelected,
                                    empty: this.props.cell.text === "",
                                }
                            )}
                            style={{
                                width: "calc(100% - 16px)",
                            }}
                            >
                            {this.renderCellType()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

