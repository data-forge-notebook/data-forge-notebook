// https://gist.github.com/ashleydavis/ee0ef4d216f5b4fc9a6bc7c72197e9c4

export type GenericHandler = (...args: any[]) => Promise<any>;
export type BasicEventHandler = () => Promise<void>;
export type SenderEventHandler<SenderT> = (sender: SenderT) => Promise<void>;

//
// Simulate C# style events in JS.
//
export interface IEventSource<HandlerType extends GenericHandler> {
    //
    // Attach a handler for this event.
    //
    attach(handler: HandlerType): void;

    //
    // Detach a handler for this event.
    //
    detach(handler: HandlerType): void;

    //
    // Raise the event.
    //
    readonly raise: HandlerType;
};

//
// Simulate C# style events in JS.
//
export class EventSource<HandlerType extends GenericHandler> implements IEventSource<HandlerType> {

    //
    // Registered handlers for the event.
    //
    private handlers: Set<HandlerType> = new Set<HandlerType>();

    //
    // Attach a handler for this event.
    //
    attach(handler: HandlerType): void {
        this.handlers.add(handler);
    }

    //
    // Detach a handler for this event.
    //
    detach(handler: HandlerType): void {
        this.handlers.delete(handler);
    }

    private async raiseInternal(args: any[]): Promise<void> {
        /* #if debug */
        //console.log("Raising event " + this.name);
        /* #endif */

        for (const handler of this.handlers) {
            await handler.apply(null, args);
        }

        /* #if debug */
        //console.log("Raised event " + this.name);
        /* #endif */
    }

    readonly raise: HandlerType = ((...args: any[]): Promise<any> => {
        return this.raiseInternal(args);
    }) as HandlerType;

}