//
// Renders a user pluggable visualization for a cell output.
//

import { InjectableClass, InjectProperty } from '@codecapers/fusion';
import * as React from 'react';
import { IPluginRequest, IPluginRepo, IPluginRepo_ID, IPluginConfig } from '../../../../services/plugin-repository';

export interface IPluggableVisualizationProps {
    //
    // Determines the plugin that is requested for visualization.
    //
    pluginRequest: IPluginRequest;

    //
    // Determines the plugin that is requested for visualization.
    //
    pluginConfig?: IPluginConfig;
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

        this.onLoad = this.onLoad.bind(this);
    }

    //
    // Event raised when the iframe has loaded.
    //
    private onLoad() {
        //
        // Configures the plugin that is running within the iframe.
        //
        this.iframeRef.current?.contentWindow?.postMessage({
            name: "config",
            data: this.props.pluginRequest,
        }, "*");
    }

    render() {

        if (this.props.pluginConfig?.url) {
            return (
                <>
                    <iframe 
                        className="mx-auto"
                        style={{
                            width: "100%",
                            height: "100%",
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
                            height: "100%",
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
