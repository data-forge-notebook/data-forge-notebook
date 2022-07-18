//
// Tracks if a particular event was raised.
//
export async function trackEventRaised<T>(
    obj: T, 
    eventName: string,
    check?: (...args: any[]) => Promise<void>
        ) {
    let eventRaised = false;
    (obj as any)[eventName].attach(async (...args: any[]) => {
        eventRaised = true;
    
        if (check) {
            await check(...args);
        }
    });

    return {
        wasEventRaised: () => {
            return eventRaised;
        },

        expectEventRaised: () => {
            expect(eventRaised).toBe(true);
        },

        expectEventNotRaised: () => {
            expect(eventRaised).toBe(false);
        },
    };
}

//
// Tracks a set of events to see if they have been raised.
//
export async function trackEventsRaised<T>(
    obj: T, 
    eventNames: string[]
        ) {

    let eventsRaised: { [eventName: string]: boolean;} = {};
    
    for (const eventName of eventNames) {
        (obj as any)[eventName].attach((...args: any[]) => {
            eventsRaised[eventName] = true;
        });
    }

    function allEventsRaised() {
        return Object.values(eventsRaised).length > 0;
    }

    function noEventsRaised() {
        const values = Object.values(eventsRaised);
        return values.length === 0;
    }

    return {
        wasEventRaised: (eventName: string) => {
            return eventsRaised[eventName];
        },

        allEventsRaised: allEventsRaised,

        expectEventRaised: () => {
            if (!allEventsRaised()) {
                throw new Error(`Expected all events raised, but some events were not raised: \r\n${JSON.stringify(eventsRaised, null, 4)}`)
            }
        },

        expectEventNotRaised: () => {
            if (!noEventsRaised()) {
                throw new Error(`Expect no events raised, some events were not raised: \r\n${JSON.stringify(eventsRaised, null, 4)}`)
            }
        },
    };
}

//
// Expects that a named event was raised after `action()` is invoked.
//
export async function expectEventRaised<T>(
    obj: T, 
    eventName: string, 
    action: () => Promise<void>,
    check?: (...args: any[]) => Promise<void>
        ): Promise<void> {

    const eventTracker = await trackEventRaised(obj, eventName);

    await action();

    expect(eventTracker.wasEventRaised()).toBe(true);
}

//
// Expects that a named event was not raised after `action()` is invoked.
//
export async function expectEventNotRaised<T>(
    obj: T, 
    eventName: string, 
    action: () => Promise<void>
        ): Promise<void> {

    const eventTracker = await trackEventRaised(obj, eventName);

    await action();

    expect(eventTracker.wasEventRaised()).toBe(false);
}
