//
// Renders a user pluggable visualization for a cell output.
//

import { InjectableClass, InjectProperty } from '@codecapers/fusion';
import * as React from 'react';
import { IPluginRequest, IPluginContent, IPluginRepo, IPluginRepo_ID } from '../../../../services/plugin-repository';

export interface IPluggableVisualizationProps {
    //
    // Plugin configuration.
    //
    config: IPluginRequest;
}

export interface IPluggableVisualizationState {
    //
    // The content for the visualization plugin, once loaded.
    //
    pluginContent?: IPluginContent;
}

@InjectableClass()
export class PluggableVisualization extends React.Component<IPluggableVisualizationProps, IPluggableVisualizationState> {

    @InjectProperty(IPluginRepo_ID)
    pluginRepo!: IPluginRepo;

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

    async componentDidMount() {

        //
        // Loads the plugin to render the data.
        //        
        const pluginContent = await this.pluginRepo.getPlugin(this.props.config);

        this.setState({
            pluginContent: pluginContent,
        });
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
            data: this.props.config,
        }, "*");
    }

    render() {
        if (this.state.pluginContent?.url) {
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
                        src={this.state.pluginContent?.url}
    
                        title="Visualization plugin"
                        sandbox="allow-scripts"
                        />
                </>
            )
        }

        if (this.state.pluginContent?.inline) {
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
    
                        srcDoc={this.state.pluginContent?.inline}
    
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
