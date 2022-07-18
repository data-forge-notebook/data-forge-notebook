//
// Interface for logging.
//

export const ILogId = "ILog";

export interface ILog   {
    info(...args: any[]): void;
    warn(...args: any[]): void;
    error(...args: any[]): void;
    verbose(...args: any[]): void;
    debug(...args: any[]): void;
}

export class ConsoleLog implements ILog {
    info (...args: any[]): void {
        console.log(...args);
    }
    
    warn(...args: any[]): void {
        console.warn(...args);
    }
    
    error(...args: any[]): void {
        console.error(...args);
    }
    
    verbose(...args: any[]): void {
        console.log(...args);
    }

    debug(...args: any[]): void {
        console.log(...args);
    }
};