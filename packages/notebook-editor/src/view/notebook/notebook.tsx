import * as React from 'react';
import { INotebookViewModel } from "../../view-model/notebook";
import { DropResult, DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { CellUI } from './editor/cell/cell';
import classNames from 'classnames';
import { observer } from 'mobx-react';

export interface INotebookProps {
    //
    // The model of the notebook.
    //
    notebook: INotebookViewModel;
}

export interface INotebookState {
    //
    // Set to true while dragging.
    //
    isDragging: boolean;
}

function getCellStyle(isDragging: boolean, draggableStyle: any) {
    const style: any = { // Styles we need to apply on draggables.            
        ...draggableStyle,
        paddingTop: "5px",
        paddingBottom: "3px",
    };

    if (isDragging) {
        style.border = "black dashed 1px"
        style.background = "#EBECF0";
    }
    
    return style;
}

const NotebookCells = observer(({ notebook, isDragging }: { notebook: INotebookViewModel, isDragging: boolean }) => {
    return (
        <>
            {notebook.cells.map((cell, index) => (
                <Draggable
                    key={cell.instanceId} 
                    draggableId={cell.instanceId}
                    index={index}
                    >
                    {(provided, snapshot) => (
                        <div
                            className={classNames(
                                "pos-relative",
                                {
                                    dragging: isDragging
                                },
                            )}
                            ref={provided.innerRef}
                            {...provided.draggableProps}

                            style={getCellStyle(
                                snapshot.isDragging,
                                provided.draggableProps.style
                            )}
                            >
                            <CellUI
                                cell={cell} 
                                notebook={notebook}
                                dragHandleProps={provided.dragHandleProps}
                                />
                        </div>
                    )}
                </Draggable>
            ))}
        </>
    );
});

class NotebookUIView extends React.Component<INotebookProps, INotebookState> {

    constructor (props: INotebookProps) {
        super(props);

        this.state = {
            isDragging: false,
        };
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

        this.props.notebook.moveCell(result.source.index, result.destination.index);

        this.setState({ isDragging: false });
    }

    render () {
        const cells = this.props.notebook.cells;

        return (
            <div>
                <div className="flex flex-col">
                    <DragDropContext
                        onDragStart={this.onDragStart}
                        onDragUpdate={this.onDragUpdate}
                        onDragEnd={this.onDragEnd}
                        >
                        <Droppable
                            droppableId={this.props.notebook.instanceId}
                            type="cell"
                            >
                            {(provided) => ( 
                                <div 
                                    className="flex flex-col"
                                    ref={provided.innerRef}
                                    {...provided.droppableProps}
                                    >
                                    <NotebookCells
                                        notebook={this.props.notebook}
                                        isDragging={this.state.isDragging}
                                        />
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

export const NotebookUI = observer(NotebookUIView);