//
// Displays a snippet of output from a code cell.
//

import * as React from 'react';
import { NumberSize, Resizable } from "re-resizable";
import { Icon } from '@blueprintjs/core';
import { Direction } from 're-resizable/lib/resizer';
import { ICellOutputViewModel } from '../../../../view-model/cell-output';
import { ErrorBoundary } from 'browser-utils';
import { handleAsyncErrors } from 'utils';
import { PluggableVisualization } from './pluggable-visualization';
import { IPluginConfig, IPluginRepo, IPluginRepo_ID } from '../../../../services/plugin-repository';
import { InjectableClass, InjectProperty } from '@codecapers/fusion';
import { updateState } from 'browser-utils';
import { IPluginRequest } from 'host-bridge';
import { INotebookViewModel } from '../../../../view-model/notebook';

export interface ICellOutputProps {

    //
    // View model for the cell.
    //
    model: ICellOutputViewModel;

    //
    // View model for the notebook.   
    //
    notebookModel: INotebookViewModel;
}

export interface ICellOutputState {
    //
    // Height of the output.
    //
    height?: number;
}

const MIN_OUTPUT_HEIGHT = 10;
const MAX_INITIAL_HEIGHT = 200;
const DRAG_HANDLE_HEIGHT = 10;

@InjectableClass()
export class CellOutputUI extends React.Component<ICellOutputProps, ICellOutputState> {

    @InjectProperty(IPluginRepo_ID)
    pluginRepo!: IPluginRepo;

    //
    // Determines the plugin that is requested for visualization.
    //
    pluginRequest?: IPluginRequest;

    //
    // The content and configuration for the plugin that renders this output.
    //
    pluginConfig?: IPluginConfig;

    constructor(props: ICellOutputProps) {
        super(props);

        this.state = {
            height: this.props.model.getHeight(), // Get the previoulsy saved height.
        };
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
        // There is no saved height for this output, use the content height.
        //
        await updateState(this, {
            height: Math.min(MAX_INITIAL_HEIGHT, contentHeight),
        });
    }

    render() {

        const outputValue = this.props.model.getValue();
        const what = outputValue.getDisplayType() || "unset";

        if (this.pluginRequest === undefined) {
            this.pluginRequest = {
                displayType: outputValue.getDisplayType(),
                plugin: outputValue.getPlugin(),
                data: outputValue.getData(),
            };
    
            this.pluginConfig = this.pluginRepo.getPlugin(this.pluginRequest);
        }
        
        let height = this.state.height;
        if (height === undefined) {
            if (this.pluginConfig!.defaultHeight !== undefined) {
                height = this.pluginConfig!.defaultHeight; // Use the default height for the plugin.
                this.setState({ // Update height in state.
                    height,
                });
            }
            else {    
                //
                // Do an initial (hidden) render to determine the initial height.
                //
                return (
                    <div 
                        className="output-border"
                        style={{ visibility: "hidden" }}
                        >
                        <PluggableVisualization
                            pluginRequest={this.pluginRequest}
                            pluginConfig={this.pluginConfig}
                            pluginOptions={{
                                cwd: this.props.notebookModel.getStorageId().getContainingPath(),
                            }}
                            onResize={this.setHeightFromContent}
                            />
                    </div>
                );
            }
        }

        height = Math.max(height, MIN_OUTPUT_HEIGHT);

        //
        // After the plugin is initially sized up, render a different version that allows the user to resize it.
        //

        return (
            <ErrorBoundary
                what={`cell output - type: ${what}`}
                >
                <div className="output-hover-region pos-relative">
                    <div className="output-border pos-relative">
                        <Resizable
                            style={{
                                overflow: "hidden",
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
                            }}
                            >
                            {/*
                                Note: No need to handle plugin resize event here, because it's only required when the plugin
                                is initially rendered, which is handled above.
                            */}
                            <PluggableVisualization
                                pluginRequest={this.pluginRequest}
                                pluginConfig={this.pluginConfig}
                                pluginOptions={{
                                    cwd: this.props.notebookModel.getStorageId().getContainingPath(),
                                }}        
                                height={`${height}px`}
                                />
                        </Resizable>

                        <div className="output-hover-content" >
                            <div
                                className="flex flex-col items-center w-full" 
                                style={{ 
                                    pointerEvents: "none",
                                    height: `${DRAG_HANDLE_HEIGHT}px`,
                                    position: "absolute",
                                    bottom: "12px",
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
                    </div>

                </div>
            </ErrorBoundary>
        );
    }
}
