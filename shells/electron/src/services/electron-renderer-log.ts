import { ILog } from "utils";
const log = require('../lib/electron-log');
const format = require('../lib/electron-log/lib/format');
const utils = require('../lib/electron-log/lib/utils');
import { ipcRenderer } from "electron";

log.transports.console.level = 'info';
log.transports.file.level = 'info';
log.transports.console.format = "[{level}] {text}";
log.transports.file.format = "[{level}] {text}";

ipcRenderer.on("log-from-main", (event: any, msg: any) => {
    // Receive log from main and output to renderer's console.
    log.transports.console(msg);
});

export class ElectronWindowLog implements ILog {

    //
    // The source of the output.
    ///
    private src: string;

    constructor(src: string) {
        this.src = src;
    }

    private buildMsg(message: string, level: string): any {

        var msg = {
            data: [ message ],
            date: new Date(),
            level: level,
            variables: {
                src: this.src,
            },
            styles: [],
        };
    
        return msg;
    }

    private sendLog(message: string, level: string): void {
        // Log emitted on renderer.
        const msg = this.buildMsg(message, level);

        log.transports.console(msg); // Send to console.
    
        msg.data = msg.data.map(format.stringifyObject);
        utils.sendIpcToMain('log-from-renderer', msg);  // Send to main process.
    }

    private wrapColor(msg: string, color: string): string {
        return color + msg + "\u001b[37m";
    }
    
    info(msg: string): void {
        this.sendLog(msg, "info");
    }

    warn(msg: string): void {
        this.sendLog(this.wrapColor(msg, "\u001b[33m"), "warn");
    }

    error(msg: string): void {
        this.sendLog(this.wrapColor(msg, "\u001b[31m"), "error");
    }
    
    verbose(msg: string): void {
        this.sendLog(msg, "verbose");
    }

    debug(msg: string): void {
        this.sendLog(this.wrapColor(msg, "\u001b[34m"), "debug");
    }
}