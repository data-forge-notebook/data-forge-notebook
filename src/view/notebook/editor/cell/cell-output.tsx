//
// Displays a snippet of output from a code cell.
//

import * as React from 'react';
import styled from 'styled-components';
import { NumberSize, Resizable } from "re-resizable";
import { Icon } from '@blueprintjs/core';
import { Direction } from 're-resizable/lib/resizer';
import { ICellOutputViewModel } from '../../../../view-model/cell-output';
import { ErrorBoundary } from '../../../../lib/error-boundary';
import { handleAsyncErrors } from '../../../../lib/async-handler';
import { PluggableVisualization } from './pluggable-visualization';

export interface ICellOutputProps {
    model: ICellOutputViewModel;

    //
    // Callback to update cell height.
    //
    onHeightChanged: () => void;
}

export interface ICellOutputState {
    //
    // Height of the output, but only if it has been resized by the user.
    //
    height?: number;
}

const MIN_OUTPUT_HEIGHT = 30;
const MAX_INITIAL_HEIGHT = 200;
const DRAG_HANDLE_HEIGHT = 4;

export class CellOutputUI extends React.Component<ICellOutputProps, ICellOutputState> {

    private outputContainerElement: React.RefObject<HTMLDivElement>;

    constructor(props: ICellOutputProps) {
        super(props);

        this.outputContainerElement = React.createRef<HTMLDivElement>();

        this.state = {
            height: this.props.model.getHeight() || this.props.model.getInitialHeight(),
        };
    }

    componentDidMount() {
        if (this.state.height === undefined && this.outputContainerElement.current) {
            this.setState({
                height: Math.min(MAX_INITIAL_HEIGHT, this.outputContainerElement.current.clientHeight + DRAG_HANDLE_HEIGHT), // Adding some pixels here to account for the height of the drag handle.
            });
        }
    }

    render() {

        const OutputBorder = styled.div`
            font-family: 'Source Code Pro', monospace !important;
            font-size: 0.85em;
            border: 1px dashed #F8F8F8;
            border-top: 1px dashed rgba(0, 0, 0, 0);
            overflow: hidden;
            transition: border 0.2s ease-in-out;
            padding: 6px;
            padding-bottom: 0px;
            background-color: #FDFDFD;
            user-select: text;
            height: 100%;

            :hover {
                border: 1px dashed rgba(0, 0, 0, 0.1);
                transition: border 0.2s ease-in-out;
            }
        `;

        const what = this.props.model.getValue() && this.props.model.getValue().getDisplayType() || "unset"

        if (this.state.height === undefined) {
            // Do an initial render to determine the default height.
            return (
                <ErrorBoundary
                    what={`cell output - type: ${what}`}
                    >
                    <OutputBorder ref={this.outputContainerElement}>
                        <PluggableVisualization
                            config={{
                                displayType: this.props.model.getValue().getDisplayType(),
                                data: this.props.model.getValue().getData(),
                            }}
                            />
                    </OutputBorder>
                </ErrorBoundary>
            );
        }

        const height = Math.max(this.state.height, MIN_OUTPUT_HEIGHT);
        const outputWrapperStyle: any = {};
        const isOutputFullHeight = this.props.model.isOutputFullHeight();
        if (isOutputFullHeight) {
            outputWrapperStyle.height = "100%";
        }

        const outputScrollerStyle: any = {
            height: "100%",
            overflow: "auto",
        };
        if (isOutputFullHeight) {
            outputScrollerStyle.overflow = "hidden";
        }

        return (
            <ErrorBoundary
                what={`cell output - type: ${what}`}
                >
                <div className="output-hover-region pos-relative">
                    <OutputBorder className="pos-relative">
                        <Resizable
                            style={{
                                overflow: "hidden",
                                paddingBottom: "6px",
                            }}
                            enable={{
                                bottom: true,
                            }}
                            defaultSize={{
                                width: "100%",
                                height,
                            }}
                            size={{
                                width: "100%",
                                height,
                            }}
                            minHeight={MIN_OUTPUT_HEIGHT}
                            onResize={() => {
                                this.props.model.notifyResized();
                                this.props.onHeightChanged();
                            }}
                            onResizeStop={(event: MouseEvent | TouchEvent,
                                direction: Direction,
                                refToElement: HTMLElement,
                                delta: NumberSize) => {

                                this.props.model.notifyResized();

                                const height = Math.max(refToElement.clientHeight, MIN_OUTPUT_HEIGHT);
                                this.setState({
                                    height,
                                });
                                handleAsyncErrors(() => this.props.model.setHeight(height)); // Save height to notebook.
                                this.props.onHeightChanged();
                            }}
                            >
                            <div style={outputScrollerStyle} >
                                <div 
                                    style={outputWrapperStyle}
                                    ref={this.outputContainerElement}
                                    >
                                    <PluggableVisualization
                                        config={{
                                            displayType: this.props.model.getValue().getDisplayType(),
                                            data: this.props.model.getValue().getData(),
                                        }}
                                        />
                                </div>
                            </div>

                        </Resizable>
                        <div className="output-hover-content">
                            <div
                                className="flex flex-col items-center w-full" 
                                style={{ 
                                    pointerEvents: "none",
                                    height: `${DRAG_HANDLE_HEIGHT}px`,
                                    position: "absolute",
                                    bottom: "5px",
                                }}
                                >
                                <Icon 
                                    icon="drag-handle-horizontal" 
                                    style={{
                                        zIndex: 500,
                                    }}
                                    iconSize={16}
                                    />
                            </div>
                        </div>
                    </OutputBorder>

                </div>
            </ErrorBoundary>
        );
    }
}
