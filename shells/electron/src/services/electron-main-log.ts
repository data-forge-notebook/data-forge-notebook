import { ILog } from "utils";
const log = require('../lib/electron-log');
const format = require('../lib/electron-log/lib/format');
const utils = require('../lib/electron-log/lib/utils');
import { ipcMain } from "electron";

log.transports.console.level = 'info';
log.transports.file.level = 'info';
log.transports.console.format = "[{level}] (\u001b[35m{src}\u001b[37m) {text}";
log.transports.file.format = "[{level}] (\u001b[35m{src}\u001b[37m) {text}";

ipcMain.on("log-from-renderer", (event: any, msg: any) => {
    // Receive log from renderer and output to main's console and file.
    log.transports.console(msg);
    log.transports.file(msg);
});

export class ElectronMainLog implements ILog {

    setOutput(filePath: string) {
        if (filePath) {
            log.transports.file.file = filePath;
            log.transports.file.clear();
            log.transports.file.init();
        }
    }

    private buildMsg(message: string, level: string): any {

        var msg = {
            data: [ message ],
            date: new Date(),
            level: level,
            variables: {
                src: "main",
            },
            styles: [],
        };
    
        return msg;
    }
    
    private sendLog(message: string, level: string): void {
        // Log emitted on main.
        const msg = this.buildMsg(message, level);
    
        log.transports.console(msg); // Send to console.
        log.transports.file(msg); // Send to main.
    
        msg.data = msg.data.map(format.stringifyObject);
        utils.sendIpcToRenderer('log-from-main', msg); // Send to renderer in dev.
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