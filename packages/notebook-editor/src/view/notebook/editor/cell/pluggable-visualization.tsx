//
// Renders a user pluggable visualization for a cell output.
//

import { connnectPlugin, IPluginOptions, IPluginRequest } from 'host-bridge';
import * as React from 'react';
import { IPluginConfig } from '../../../../services/plugin-repository';

export interface IPluggableVisualizationProps {
    //
    // Determines the plugin that is requested for visualization.
    //
    pluginRequest: IPluginRequest;

    //
    // Options to pass to the plugin.
    //
    pluginOptions: IPluginOptions;

    //
    // Determines the plugin that is requested for visualization.
    //
    pluginConfig?: IPluginConfig;

    //
    // Sets the height of the iframe.
    //
    height?: string;
}

export interface IPluggableVisualizationState {
}

export class PluggableVisualization extends React.Component<IPluggableVisualizationProps, IPluggableVisualizationState> {

    //
    // Reference to the iframe that is the container for the output plugin.
    //
    private iframeRef: React.RefObject<HTMLIFrameElement>;

    constructor(props: IPluggableVisualizationProps) {
        super(props);

        this.state = {};

        this.iframeRef = React.createRef<HTMLIFrameElement>();
    }

    //
    // Event raised when the iframe has loaded.
    //
    private onLoad = () => {
        if (!this.iframeRef.current) {
            throw new Error(`Iframe not mounted!`);
        }

        //
        // Configures the plugin that is running within the iframe.
        //
        connnectPlugin(
            this.iframeRef.current,
            this.props.pluginRequest, 
            this.props.pluginOptions,
            {}
        );
    }

    render() {

        if (this.props.pluginConfig?.url) {
            return (
                <>
                    <iframe 
                        className="mx-auto"
                        style={{
                            width: "100%",
                            height: this.props.height,
                        }}
                        onLoad={this.onLoad}
                        ref={this.iframeRef}
                        src={this.props.pluginConfig?.url}
    
                        title="Visualization plugin"
                        sandbox="allow-scripts"
                        />
                </>
            )
        }

        if (this.props.pluginConfig?.content) {
            return (
                <>
                    <iframe 
                        className="mx-auto"
                        style={{
                            width: "100%",
                            height: this.props.height,
                        }}
                        onLoad={this.onLoad}
                        ref={this.iframeRef}
    
                        srcDoc={this.props.pluginConfig?.content}
    
                        title="Visualization plugin"
                        sandbox="allow-scripts"
                        />
                </>
            );
        }

        return (
            <div>Plugin not loaded</div>
        );
    }
}
