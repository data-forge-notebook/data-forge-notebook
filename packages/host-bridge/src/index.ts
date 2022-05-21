//
// Configuration for the visualization.
//
export interface IVizConfig {

    //
    // Identifies the type of data being visualized.
    //
    displayType?: string;

    //
    // The data to be visualized.
    //
    data: any;
}

//
// Options to the connect function.
//
export interface IConnectOptions {

    //
    // Callback for the host to configure the visualization plugin.
    //
    configure: (config: IVizConfig) => Promise<void>;
}

//
// Defines an event coming in from the visualization host.
//
interface IIncomingEvent {
    //
    // Names the event.
    //
    name: string;

    //
    // Data accompanying the event.
    //
    data: any;
}

async function handlePluginErrors(
    fnName: string, 
    fn: () => Promise<void>,
    onSuccess: () => void,
    onFail: () => void
        ): Promise<void> {

    try {
        await fn();

        onSuccess();
    }
    catch (err: any) {
        onFail();

        console.error(`Error from plugin function ${fnName}.`);
        console.error(err && err.stack || err);
    }
}

//
// Connects the communication bridge to the visualization host.
//
export function connect(options: IConnectOptions) {
    window.addEventListener("message", async event => {

        const payload = event.data as IIncomingEvent;
        if (payload.name === "config") {
            await handlePluginErrors(
                "configure", 
                async () => options.configure(payload.data),

                // Success
                () => {
                    event.source?.postMessage({ name: "configured" }, { 
                        targetOrigin: event.origin,
                    });
                },

                // Fail
                () => {
                    event.source?.postMessage({ name: "configure-failed" }, { 
                        targetOrigin: event.origin,
                    });
                }
            );
        }
    });   
}