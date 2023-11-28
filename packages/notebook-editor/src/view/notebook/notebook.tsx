import * as React from 'react';
import { INotebookViewModel } from "../../view-model/notebook";
import { DropResult, DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { CellUI } from './editor/cell/cell';
import { forceUpdate } from 'browser-utils';
import classNames from 'classnames';

export interface INotebookProps {
    model: INotebookViewModel;
}

export interface INotebookState {
    //
    // Set to true while dragging.
    //
    isDragging: boolean;
}

export class NotebookUI extends React.Component<INotebookProps, INotebookState> {

    constructor (props: any) {
        super(props);

        this.state = {
            isDragging: false,
        };
    }

    componentDidMount() {
        this.props.model.onCellsChanged.attach(this.onCellsChanged);
    }

    componentWillUnmount() {
        this.props.model.onCellsChanged.detach(this.onCellsChanged);
    }

    private onCellsChanged = async (): Promise<void> => {
        await forceUpdate(this); 
    }
    
    private onDragStart = () => {
        this.setState({ isDragging: true });
    }

    private onDragUpdate = () => {
    }

    private onDragEnd = async (result: DropResult) => {

        if (!result.destination) {
            this.setState({ isDragging: false });
            return;
        }

        this.props.model.moveCell(result.source.index, result.destination.index);

        this.setState({ isDragging: false });
    }

    private getCellStyle(isDragging: boolean, draggableStyle: any) {
        const style: any = { // Styles we need to apply on draggables.            
            ...draggableStyle,
            paddingTop: "6px",
            paddingBottom: "6px",
        };

        if (isDragging) {
            style.border = "black dashed 1px"
            style.background = "#EBECF0";
        }
        
        return style;
    }

    render () {
        const cells = this.props.model.getCells();
        let hoverRegionClass = "pos-relative";

        return (
            <div>
                <div className="flex flex-col">
                    <DragDropContext
                        onDragStart={this.onDragStart}
                        onDragUpdate={this.onDragUpdate}
                        onDragEnd={this.onDragEnd}
                        >
                        <Droppable
                            droppableId={this.props.model.getInstanceId()}
                            type="cell"
                            >
                            {(provided) => ( 
                                <div 
                                    className="flex flex-col"
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    >
                                    {cells.map((cell, index) => (
                                        <Draggable
                                            key={cell.getId()} 
                                            draggableId={cell.getId()}
                                            index={index}
                                            >
                                            {(provided, snapshot) => (
                                                <div
                                                    className={classNames(
                                                        "pos-relative",
                                                        {
                                                            dragging: this.state.isDragging
                                                        },
                                                    )}
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}

                                                    style={this.getCellStyle(
                                                        snapshot.isDragging,
                                                        provided.draggableProps.style
                                                    )}
                                                    >
                                                    <CellUI
                                                        language={this.props.model.getLanguage()}
                                                        model={cell} 
                                                        notebookModel={this.props.model}
                                                        dragHandleProps={provided.dragHandleProps}
                                                        />
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>
                </div>
                
                {/* Blank space at end of notebook. */ }
                <div 
                    style={{
                        height: "50px"
                    }}
                    >
                </div>
            </div>
        );
    }
}
