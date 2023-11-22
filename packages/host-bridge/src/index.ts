import { v4 as uuidv4 } from 'uuid';

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
}

//
// Options to the connect function.
//
export interface IHostConnectOptions {

    //
    // Callback for the host to configure the visualization plugin.
    //
    configure: (config: IConfigEventData) => Promise<void>;
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
// Options to pass to the pluging.
//
export interface IPluginOptions {
    //
    // Working directory for the current notebook.
    //
    cwd?: string;
}


//
// Defines the configuration event.
//
export interface IConfigEventData {

    //
    // Configuration for the plugin.
    //
    pluginRequest: IPluginRequest;

    //
    // ID for the plugin.
    //
    pluginId: string;

    //
    // Options for the plugin.
    //
    pluginOptions: IPluginOptions;
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
                async () => options.configure(eventData),
                () => { // Success
                    postMessage("configured");
                },
                () => { // Fail
                    postMessage("configure-failed");
                }
            );
        }
    });   

    return {
    };
}

//
// Options to the connect function.
//
export interface IPluginConnectOptions {
}

//
// Represents the connection to the plugin.
//
export interface IPluginConnection {
}

//
// Connects the communication bridge to a visualization plugin running in an iframe.
//
export function connnectPlugin(iframe: HTMLIFrameElement, pluginRequest: IPluginRequest, pluginOptions: IPluginOptions, options?: IPluginConnectOptions): IPluginConnection {
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
    // Listen to messages incoming from the plugin.
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

        //
        // I've left this code as an edxample of handing events from the plugin.
        //
        // if (pluginEvent.name === "on-something") {
        //     const somethingPluginEvent = pluginEvent as IPluginEvent<ISomethingEventData>;
        //     const eventData = somethingPluginEvent.data;
        //     if (eventData === undefined) {
        //         throw new Error(`Event data not supplied.`);
        //     }

        //     // do something
        // }
    });

    //
    // Configures the plugin that is running within the iframe.
    //
    postMessage<IConfigEventData>("config", { 
        pluginRequest: pluginRequest,
        pluginId,
        pluginOptions,
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