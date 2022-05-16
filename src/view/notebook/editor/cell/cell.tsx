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
import { IMonacoEditorViewModel } from '../../../../view-model/monaco-editor';
import { EventSource, BasicEventHandler } from '../../../../lib/event-source';
import { asyncHandler, throttleAsync } from '../../../../lib/async-handler';
import { forceUpdate } from '../../../../lib/force-update';
import { isElementPartiallyInViewport } from '../../../../lib/viewport';
import { CellType } from '../../../../model/cell';
import { Lazy } from '../../../../lib/lazy';
const classnames = require("classnames");

export interface ICellProps {

    //
    // The language of the code cell.
    //
    language: string;

    //
    // The model for the cell.
    //
    model: ICellViewModel;

    //
    // The model for the notebook.
    //
    notebookModel: INotebookViewModel;

    //
    // Props for a draggable cell.
    //
    dragHandleProps: DraggableProvidedDragHandleProps | undefined;
}

export interface ICellState {
}

export class CellUI extends React.Component<ICellProps, ICellState> {

    //
    // The HTML element that contains the cell.
    //
    cellContainerElement: React.RefObject<HTMLDivElement>;

    //
    // Inner cell container, not dependent on the height of the cell handle.
    // 
    innerCellContainerElement: React.RefObject<HTMLDivElement>;

    //
    // Event raised when the height of the cell has changed.
    //
    onHeightChanged = new EventSource<BasicEventHandler>();
    
    //
    // Throttled version of onErrorAdded event handler.
    //
    onErrorAddedThrottled: _.DebouncedFunc<any>;

    //
    // Throttled version of onOutputChanged event handler.
    //
    onOutputChangedThrottled: _.DebouncedFunc<any>;

    constructor (props: any) {
        super(props)

        this.state = {};

        this.cellContainerElement = React.createRef<HTMLDivElement>();
        this.innerCellContainerElement = React.createRef<HTMLDivElement>();

        this.onFlushChanges = asyncHandler(this, this.onFlushChanges);
        this.onEditorSelectionChanged = this.onEditorSelectionChanged.bind(this);
        this._onHeightChanged = asyncHandler(this, this._onHeightChanged);
        this.recordCellHeight = this.recordCellHeight.bind(this);
        this.onScrollIntoView = this.onScrollIntoView.bind(this);
        this.onCellFocused = asyncHandler(this, this.onCellFocused);
        this.onErrorAddedThrottled = throttleAsync(this, this.onErrorAdded, 500);
        this.onOutputChangedThrottled = throttleAsync(this, this.onOutputChanged, 500);        
    }

    componentDidMount() {
        this.props.model.onEditorSelectionChanged.attach(this.onEditorSelectionChanged);
        this.props.model.onScrollIntoView.attach(this.onScrollIntoView);
        this.props.model.onErrorsChanged.attach(this.onErrorAddedThrottled);
        this.props.model.onOutputChanged.attach(this.onOutputChangedThrottled);
        this.props.model.onFlushChanges.attach(this.onFlushChanges);

        if (this.props.model.getHeight() === undefined) {
            // No starting height.
            // this.log.info(`-- No starting height for cell ${this.props.model.getId()}, recording initial height.`);
            this.recordCellHeight();
        }
        else {
            // this.log.info(`-- Cell ${this.props.model.getId()} has starting height recorded at ${this.props.model.getHeight()}.`);
        }
    }

    componentWillUnmount() {
        this.props.model.onEditorSelectionChanged.detach(this.onEditorSelectionChanged);
        this.props.model.onScrollIntoView.detach(this.onScrollIntoView);
        this.props.model.onErrorsChanged.detach(this.onErrorAddedThrottled);
        this.props.model.onOutputChanged.detach(this.onOutputChangedThrottled);
        this.props.model.onFlushChanges.detach(this.onFlushChanges);
    }

    shouldComponentUpdate(nextProps: any, nextState: any) {
        // Stops the cell from rerendering and makes drag and drop fast!
        return false;
    }

    //
    // Event raised to flush changes through the model.
    //
    async onFlushChanges(): Promise<void> {
        this.onOutputChangedThrottled.cancel();
    }

    //
    // Event raised when this cell has been selected or unselected.
    //
    async onEditorSelectionChanged(cell: IMonacoEditorViewModel): Promise<void> {
        await forceUpdate(this);
    }

    private async onCellFocused(): Promise<void> {
        // Automatically select cell when focused.
        if (!this.props.model.isSelected()) {
            await this.props.model.select();
        }
    }

    //
    // Event raised when the height of the code editor has changed.
    //
    private async _onHeightChanged(): Promise<void> {
        this.recordCellHeight();

        //
        // Causes the cell handle to resize itself to the height of the code editor.
        //
        await this.onHeightChanged.raise();
    }

    //
    // Errors where added to the cell.
    //
    async onErrorAdded(): Promise<void> {
        await forceUpdate(this);

        await this._onHeightChanged();
    }

    //
    // Output was added to the cell.
    //
    async onOutputChanged(): Promise<void> {
        await forceUpdate(this);

        await this._onHeightChanged();
    }

    //
    // Record the rendered height of the cell.
    //
    private recordCellHeight(): void {
        if (this.cellContainerElement.current) {
            this.props.model.setHeight(this.cellContainerElement.current.offsetHeight);
        }
    }

    //
    // Scroll the notebook so the cell is visible.
    //
    private onScrollIntoView(scrollReason: string): void {
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
        const cellType = this.props.model.getCellType();
        if (cellType === CellType.Code) {
            return (
                <CodeCellUI 
                    language={this.props.language}
                    model={this.props.model as ICodeCellViewModel} 
                    onHeightChanged={this._onHeightChanged}
                    />
            );
        }
        else if (cellType === CellType.Markdown) {
            return (
                <MarkdownCellUI 
                    model={this.props.model as IMarkdownCellViewModel} 
                    onHeightChanged={this._onHeightChanged}
                    />
            );
        }
        else {
            throw new Error("Unknown cell type!");
        }
    }

    render () {
        const canExecute = this.props.model.getCellType() === CellType.Code;
        const isSelected = this.props.model.isSelected();

        return (
            <div 
                ref={this.cellContainerElement}
                onFocus={this.onCellFocused}
                data-test={this.props.model.getHeight()}
                >
                <Lazy
                    id={"cell-" + this.props.model.getId()}
                    height={this.props.model.getHeight()}
                    forceMount={this.props.model.isSelected()}
                    onMounted={this._onHeightChanged}
                    >
                    <div 
                        className="centered-container cell-container pos-relative"
                        >
                        <div>
                            <CellHandle
                                cell={this}
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
                                    {
                                        focused: isSelected,
                                        empty: this.props.model.getText() === "",
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
                </Lazy>
            </div>
        );
    }
}

