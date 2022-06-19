//
// Waits for X milliseconds before resuming.
//
export function sleep(timeMS: number): Promise<void> {
    return new Promise((resolve, reject) => {
        setTimeout(resolve, timeMS);
    });    
}