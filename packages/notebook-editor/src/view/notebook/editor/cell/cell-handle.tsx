//
// Renders the cell drag handle.
//

import * as React from 'react';
import { DraggableProvidedDragHandleProps } from 'react-beautiful-dnd';
import { asyncHandler } from 'utils';
import { updateState } from 'browser-utils';
import { CellUI } from './cell';
const classnames = require("classnames");

export interface ICellHandleProps {

    //
    // The parent cell.
    //
    cell: CellUI;
    
    //
    // The HTML element that contains the cell.
    //
    cellContainerElement: React.RefObject<HTMLDivElement>;

    //
    // Is the drag handle selected?
    //
    isSelected: boolean;

    //
    //  Properties for the drag handle.
    //
    dragHandleProps: DraggableProvidedDragHandleProps | undefined;
}

export interface ICellHandleState {
    //
    // The height of the cell handle.
    // Wouldn't need this except I can't find any other way to make the cell
    // handle automatically map to the height of the code editor in the cell.
    //
    height: number;
}

export class CellHandle extends React.Component<ICellHandleProps, ICellHandleState> {

    constructor(props: ICellHandleProps) {
        super(props);

        this.state = {
            height: 0,
        };

        this.onHeightChanged = asyncHandler(this, this.onHeightChanged);
    }

    componentDidMount() {
        this.props.cell.onHeightChanged.attach(this.onHeightChanged);

        setTimeout(() => {
            this.onHeightChanged(); // Bit of a hack. But wait a moment before slaving the height.
        }, 10);
    }

    componentWillUnmount() {
        this.props.cell.onHeightChanged.detach(this.onHeightChanged);
    }

    private async onHeightChanged(): Promise<void> {
        if (this.props.cellContainerElement.current) {
            await updateState(this, {
                height: this.props.cellContainerElement.current.offsetHeight,
            });
        }
    }

    render() {
        return (
            <>
                <div 
                    className={classnames(
                        "selected-cell-handle", 
                        "inline-block",
                        "align-top",
                        { 
                            focused: this.props.isSelected
                        }
                    )}
                    style={{
                        width: "8px",
                        height: `${this.state.height}px`,
                    }}
                    {...this.props.dragHandleProps} 
                    />
                <div 
                    className={classnames(
                        "cell-handle", 
                        "inline-block",
                        "align-top",
                        { 
                            focused: this.props.isSelected
                        }
                    )} 
                    style={{
                        width: "6px",
                        height: `${this.state.height}px`,
                    }}
                    {...this.props.dragHandleProps} 
                    />
            </>
        );
    }
}
