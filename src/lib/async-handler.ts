import * as _ from 'lodash';
import { DebouncedFunc } from 'lodash';

//
// A function that adapts an async handler to work with react.
//
export function asyncHandler (self: any, handler: (...args: any[]) => Promise<void>): (() => Promise<void>) {
    return (...args: any[]): Promise<void> => {
        const promise = handler.apply(self, args);
        if (promise) {
            promise.catch((err: any) => {
                console.error("Error in handler.");
                console.error(err && err.stack || err);
            });
        }
        return promise;
    };
}

//
// A simple helper function to ensure that async errors are handled.
//
export function handleAsyncErrors(fn: () => Promise<void>): void {
    const promise = fn();
    if (promise) {
        promise.catch((err: any) => {
            console.error("Error in async function.");
            console.error(err && err.stack || err);
        });
    }
}

//
// Debounce an async function and handle any errors.
// This waits until the event handler has not been invoked for 'wait' milliseconds before triggering the underlying event handler.
//
export function debounceAsync(self: any, fn: () => Promise<void>, wait: number) {
    return _.debounce(asyncHandler(self, fn), wait);
}

//
// Throttle an async function and handle any errors.
// This triggers the underlying event handler at most only every 'wait' millseconds regardless of how many times the event handler itself is triggered.
//
export function throttleAsync(self: any, fn: () => Promise<void>, wait: number) {
    return _.throttle(asyncHandler(self, fn), wait);
}