    //
// Displays a snippet of output from a code cell.
//

import * as React from 'react';
import { NumberSize, Resizable } from "re-resizable";
import { Icon } from '@blueprintjs/core';
import { Direction } from 're-resizable/lib/resizer';
import { ICellOutputViewModel } from '../../../../view-model/cell-output';
import { ErrorBoundary } from 'browser-utils';
import { PluggableVisualization } from './pluggable-visualization';
import { IPluginConfig, IPluginRepo, IPluginRepo_ID } from '../../../../services/plugin-repository';
import { InjectableClass, InjectProperty } from '@codecapers/fusion';
import { updateState } from 'browser-utils';
import { IPluginRequest } from 'host-bridge';
import { INotebookViewModel } from '../../../../view-model/notebook';
import { observer } from 'mobx-react';

export interface ICellOutputProps {

    //
    // View model for the output.
    //
    output: ICellOutputViewModel;

    //
    // View model for the notebook.   
    //
    notebook: INotebookViewModel;
}

export interface ICellOutputState {
    //
    // Height of the output.
    //
    height?: number; //todo: Does this need to be in local component state?
}

const MIN_OUTPUT_HEIGHT = 30;
const MAX_INITIAL_HEIGHT = 200;

@InjectableClass()
class CellOutputUIView extends React.Component<ICellOutputProps, ICellOutputState> {

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
            height: this.props.output.height, // Get the previoulsy saved height.
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

        const outputValue = this.props.output.value;
        const what = outputValue.displayType || "unset";

        if (this.pluginRequest === undefined) {
            this.pluginRequest = {
                displayType: outputValue.displayType,
                plugin: outputValue.plugin,
                data: outputValue.data,
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
                                cwd: this.props.notebook.storageId.getContainingPath(),
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
                            handleClasses={{
                                bottom: "output-resize-handle",
                            }}
                            handleComponent={{
                                bottom: (    
                                    <div
                                        style={{
                                            background: "transparent",
                                            width: "100%",
                                            height: "100%",
                                        }}
                                        >
                                        <div 
                                            className="mx-auto"
                                            style={{
                                                width: "25px",
                                                height: "12px",
                                                background: '#fff',
                                                borderRadius: '2px',
                                                border: '1px solid #ccc',
                                                padding: 0,                                                
                                            }}
                                            >
                                            <div
                                                className="mx-auto"
                                                style={{
                                                    width: "16px",
                                                    position: "relative",
                                                    top: "-3px",
                                                }}
                                                >   
                                                <Icon 
                                                    icon="drag-handle-horizontal" 
                                                    iconSize={16}
                                                    />
                                            </div>
                                        </div>
                                    </div>
                                ),
                            }}
                            minHeight={MIN_OUTPUT_HEIGHT}
                            onResize={(event: MouseEvent | TouchEvent,
                                direction: Direction,
                                refToElement: HTMLElement,
                                delta: NumberSize) => {

                                const height = Math.max(refToElement.clientHeight, MIN_OUTPUT_HEIGHT);
                                this.setState({
                                    height,
                                });
                                this.props.output.height = height; // Save height to notebook.
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
                                    cwd: this.props.notebook.storageId.getContainingPath(),
                                }}        
                                />
                        </Resizable>
                    </div>
                </div>
            </ErrorBoundary>
        );
    }
}

export const CellOutputUI = observer(CellOutputUIView);