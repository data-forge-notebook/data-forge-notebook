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
import { IPluginConfig, IPluginRepo, IPluginRepo_ID } from '../../../../services/plugin-repository';
import { InjectableClass, InjectProperty } from '@codecapers/fusion';
import { updateState } from '../../../../lib/update-state';
import { IPluginRequest } from 'host-bridge';

//
// The border of the output.
//
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

export interface ICellOutputProps {
    model: ICellOutputViewModel;

    //
    // Callback to update cell height.
    //
    onHeightChanged: () => void;
}

export interface ICellOutputState {
    //
    // Height of the output.
    //
    height?: number;

    //
    // Determines the plugin that is requested for visualization.
    //
    pluginRequest: IPluginRequest;

    //
    // The content and configuration for the plugin that renders this output.
    //
    pluginConfig?: IPluginConfig;
}

const MIN_OUTPUT_HEIGHT = 30;
const MAX_INITIAL_HEIGHT = 200;
const DRAG_HANDLE_HEIGHT = 10;

@InjectableClass()
export class CellOutputUI extends React.Component<ICellOutputProps, ICellOutputState> {

    @InjectProperty(IPluginRepo_ID)
    pluginRepo!: IPluginRepo;

    constructor(props: ICellOutputProps) {
        super(props);

        this.state = {
            height: this.props.model.getHeight(), // Get the saved height.
            pluginRequest: {
                displayType: this.props.model.getValue().getDisplayType(),
                plugin: this.props.model.getValue().getPlugin(),
                data: this.props.model.getValue().getData(),
            },
        };
    }

    async componentDidMount() {

        const pluginConfig = await this.pluginRepo.getPlugin(this.state.pluginRequest);
        await updateState(this, {
            pluginConfig: pluginConfig,
        });
    }

    //
    // Sets the initial output height from the content, if the height is not already set.
    //
    private setHeightFromContent = async (contentHeight: number): Promise<void> => {
        if (this.state.height !== undefined) {
            // Height already set, nothing to be done.
            return;
        }

        //
        // There is no saved height for this output, use the default plugin height or the content height.
        //

        if (this.state.pluginConfig?.defaultHeight !== undefined) {
            // Use default height for the plugin.
            await updateState(this, {
                height: this.state.pluginConfig.defaultHeight,
            });
        }
        else {
            // Default the height based on the UI.
            await updateState(this, {
                height: Math.min(MAX_INITIAL_HEIGHT, contentHeight + DRAG_HANDLE_HEIGHT), // Adding some pixels here to account for the height of the drag handle.
            });
        }

        this.props.onHeightChanged();
    }

    render() {
        const outputValue = this.props.model.getValue();
        const what = outputValue.getDisplayType() || "unset";

        if (this.state.height === undefined) {
            //
            // Do an initial render to determine the initial height.
            //
            return (
                <ErrorBoundary
                    what={`cell output - type: ${what}`}
                    >
                    <OutputBorder>
                        <PluggableVisualization
                            pluginRequest={this.state.pluginRequest}
                            pluginConfig={this.state.pluginConfig}
                            onResize={this.setHeightFromContent}
                            />
                    </OutputBorder>
                </ErrorBoundary>
            );
        }

        const height = Math.max(this.state.height, MIN_OUTPUT_HEIGHT);

        const outputScrollerStyle: any = {
            height: "100%",
            overflow: "auto",
        };

        const isOutputFullHeight = this.state.pluginConfig?.isFullHeight || false;
        if (isOutputFullHeight) {
            outputScrollerStyle.overflow = "hidden";
        }

        //
        // After the plugin is initially size up, render a different version that allows the user to resize it.
        //

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
                                {/*
                                    Note: No need to handle plugin resize event here, because it's only required when the plugin
                                    is initially rendered, which is handled above.
                                */}
                                <PluggableVisualization
                                    pluginRequest={this.state.pluginRequest}
                                    pluginConfig={this.state.pluginConfig}
                                    height={isOutputFullHeight ? "100%" : `${this.state.height-DRAG_HANDLE_HEIGHT}px`}
                                    />
                            </div>
                        </Resizable>

                        <div className="output-hover-content" >
                            <div
                                className="flex flex-col items-center w-full" 
                                style={{ 
                                    pointerEvents: "none",
                                    height: `${DRAG_HANDLE_HEIGHT}px`,
                                    position: "absolute",
                                    bottom: "3px",
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
