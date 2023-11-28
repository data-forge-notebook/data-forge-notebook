//
// Renders the cell drag handle.
//

import * as React from 'react';
import { DraggableProvidedDragHandleProps } from 'react-beautiful-dnd';
import { updateState } from 'browser-utils';
import { CellUI } from './cell';
import { sleep } from 'utils';
import { ICellViewModel } from '../../../../view-model/cell';
const classnames = require("classnames");

export interface ICellHandleProps {

    //
    // The parent cell.
    //
    cell: CellUI;

    //
    // The model for the cell.
    //
    model: ICellViewModel;
    
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
    }

    async componentDidMount() {
        this.props.cell.onHeightChanged.attach(this.onHeightChanged);

        await sleep(10); // Bit of a hack. But wait a moment before slaving the height.

        await this.onHeightChanged(); 
    }

    componentWillUnmount() {
        this.props.cell.onHeightChanged.detach(this.onHeightChanged);
    }

    private onHeightChanged = async (): Promise<void> => {
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
                        this.props.model.getCellType(),
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
                        this.props.model.getCellType(),
                        { 
                            focused: this.props.isSelected
                        }
                    )} 
                    style={{
                        height: `${this.state.height}px`,
                    }}
                    {...this.props.dragHandleProps} 
                    />
            </>
        );
    }
}
