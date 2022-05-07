import { handleAsyncErrors } from "./async-handler";

// https://gist.github.com/ashleydavis/ee0ef4d216f5b4fc9a6bc7c72197e9c4

export type BasicEventHandler = () => void;
export type SenderEventHandler<SenderT> = (sender: SenderT) => void;

//
// Simulate C# style events in JS.
//
export interface IEventSource<HandlerType extends Function> {
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
    raise(...args: any[]): Promise<void>;

    //
    // Raise the event.
    //
    raiseSync(...args: any[]): void;
};


//
// Simulate C# style events in JS.
//
export class EventSource<HandlerType extends Function> implements IEventSource<HandlerType> {

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

    //
    // Raise the event.
    //
    async raise(...args: any[]): Promise<void> {
        await this.raiseInternal(args);
    }

    //
    // Raise the event.
    //
    raiseSync(...args: any[]): void {
        handleAsyncErrors(() => this.raiseInternal(args));
    }
}