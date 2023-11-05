import { v4 as uuidv4 } from 'uuid';

//
// Auxillary data to pass to the plugin.
//
export interface IPluginAux {
    //
    // Current working directory for DFN (if applicable).
    //
    cwd?: string;
}

//
// Requests/configures the plugin.
//
export interface IPluginRequest {

    //
    // Identifies the data or the plugin used to render it.
    //
    displayType?: string;

    //
    // Specifically identifies the plugin to use to render this data.
    //
    plugin?: string;

    //
    // Data to be rendered by the plugin.
    //
    data: any;

    //
    // Auxilliary configuration.
    //
    aux?: IPluginAux;
}

//
// Options to the connect function.
//
export interface IHostConnectOptions {

    //
    // Callback for the host to configure the visualization plugin.
    //
    configure: (config: IPluginRequest) => Promise<void>;
}

//
// Defines an event coming in from a visualization plugin.
//
interface IPluginEvent<T> {
    //
    // Names the event.
    //
    name: string;

    //
    // Identifies the source of the event.
    //
    source: "viz-plugin";

    // 
    // Identifies the plugin that sent the event.
    //
    pluginId: string;

    //
    // Data accompanying the event.
    //
    data?: T;
}

//
// Defines an event coming in from the visualization host.
//
interface IHostEvent<T> {
    //
    // Names the event.
    //
    name: string;

    //
    // Identifies the source of the event.
    //
    source: "viz-host";

    //
    // Data accompanying the event.
    //
    data?: T;
}
//
// Defines the configuration event.
//
interface IConfigEventData {

    //
    // Configuration for the plugin.
    //
    config: IPluginRequest;

    //
    // ID for the plugin.
    //
    pluginId: string;
}

//
// Defines the resize event.
//
interface IResizeEventData {

    //
    // New height of the plugin.
    //
    height: number;
}

//
// Call a function and handle async errors.
//
async function handleErrors(
    fnName: string, 
    fn: () => Promise<void>,
    onSuccess?: () => void,
    onFail?: () => void
        ): Promise<void> {

    try {
        await fn();

        if (onSuccess) {
            onSuccess();
        }
    }
    catch (err: any) {
        if (onFail) {
            onFail();
        }

        console.error(`Error from plugin function ${fnName}.`);
        console.error(err && err.stack || err);
    }
}

//
// Represents the connection to the host.
//
export interface IHostConnection {
    //
    // Notify the host that the plugin has resized.
    //
    onResize(): void;
}

//
// Connects the communication bridge to the visualization host.
//
export function connectHost(options: IHostConnectOptions): IHostConnection {

    // 
    // Records the host and origin that the plugin has connected to.
    //
    let host: MessageEventSource;
    let origin: string;
    let pluginId: string;

    //
    // Posts a message to the visualization host.
    //
    function postMessage<EventDataT>(eventName: string, eventData?: EventDataT): void {
        if (!host) {
            throw new Error(`Not connected to host!`);
        }

        const event: IPluginEvent<EventDataT> = {
            name: eventName,
            source: "viz-plugin",
            pluginId: pluginId,
            data: eventData,
        };
        host.postMessage(event, { targetOrigin: origin });
    }

    //
    // Notify the host that the plugin has resized.
    //
    function onResize(): void {
        postMessage<IResizeEventData>("on-resize", { height: document.body.scrollHeight });
    };

    window.addEventListener("message", async event => {
        if (!event.source) {
            throw new Error(`Event source is not defined!`);
        }

        host = event.source;
        origin = event.origin;

        if (event.data.source !== "viz-host") {
            // Ignore messages that have not come from the visualization host.
            return;
        }

        const pluginEvent = event.data as IHostEvent<any>;
        if (pluginEvent.name === "config") {
            const configPluginEvent = pluginEvent as IHostEvent<IConfigEventData>;
            const eventData = configPluginEvent.data;
            if (eventData === undefined) {
                throw new Error(`Event data not supplied.`);
            }

            pluginId = eventData.pluginId;

            // Host is requesting configuration of the plugin.
            await handleErrors(
                "configure", 
                async () => options.configure(eventData.config),
                () => { // Success
                    postMessage("configured");
                    onResize();
                },
                () => { // Fail
                    postMessage("configure-failed");
                }
            );
        }
    });   

    return {
        onResize,
    };
}

//
// Options to the connect function.
//
export interface IPluginConnectOptions {

    //
    // Event raised when the plugin size has changed.
    // TODO: May not need to expose this to the plugin. It happens automatically already and doesn't need to happen more than once.
    //       In fact I could just get rid of the resize message entirely and pass the height back through the "configured" message.
    //
    onResize?: (height: number) => Promise<void>;
}

//
// Represents the connection to the plugin.
//
export interface IPluginConnection {
}

//
// Connects the communication bridge to a visualization plugin running in an iframe.
//
export function connnectPlugin(iframe: HTMLIFrameElement, pluginRequest: IPluginRequest, options?: IPluginConnectOptions): IPluginConnection {
    if (!iframe.contentWindow) {
        throw new Error(`Iframe content not loaded!`);
    }

    const pluginWindow = iframe.contentWindow;
    const pluginId = uuidv4();

    //
    // Posts a message to the plugin.
    //
    function postMessage<EventDataT>(eventName: string, eventData?: EventDataT) {
        const event: IHostEvent<EventDataT> = {
            name: eventName,
            source: "viz-host",
            data: eventData,
        };
        pluginWindow.postMessage(event, "*");
    }

    //
    // Listen to messages incoming from the iframe.
    //
    window.addEventListener("message", async event => {

        const pluginEvent: IPluginEvent<any> = event.data;
        if (pluginEvent.source !== "viz-plugin") {
            // Ignore messages not from the plugin.
            return;
        }

        if (pluginEvent.pluginId !== pluginId) {
            // Ignore message not from the specific plugin.
            return; 
        }

        if (pluginEvent.name === "on-resize") {
            const resizePluginEvent = pluginEvent as IPluginEvent<IResizeEventData>;
            const eventData = resizePluginEvent.data;
            if (eventData === undefined) {
                throw new Error(`Event data not supplied.`);
            }

            const onResize = options?.onResize;
            if (onResize) {
                handleErrors("onResize", () =>  onResize(eventData.height));
            }
        }
    });

    //
    // Configures the plugin that is running within the iframe.
    //
    postMessage<IConfigEventData>("config", { 
        config: pluginRequest,
        pluginId: pluginId,
    });

    return {

    };
}

//
// Deeply compare two objects.
// Used for checking if inputs to plugins have changed.
//
export function deepCompare(obj1: any, obj2: any) {
    const j1 = JSON.stringify(obj1);
    const j2 = JSON.stringify(obj2);
    return j1 === j2;
}