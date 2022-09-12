import * as React from 'react';
import { InjectableSingleton } from "@codecapers/fusion";
import { Toaster, IToaster } from '@blueprintjs/core';
import { IconName } from '@blueprintjs/icons';
import { IAction, INotification, INotificationId, INotificationParams, Level } from '../notification';
import { serializeError } from 'serialize-error';

function levelToIntent(level: Level | string) {
    switch (level) {
        case Level.Info: return "success";
        case Level.Error: return "danger";
        case Level.Success: return "success";
        case Level.Warn: return "warning";
        default: throw new Error("Unknown level.");
    }
}

function getIcon(level: Level | string): IconName {
    switch (level) {
        case Level.Info: return "info-sign";
        case Level.Error: return "error";
        case Level.Success: return "tick";
        case Level.Warn: return "warning-sign";
        default: throw new Error("Unknown level.");
    }
}

function prepMessage(msg: React.ReactNode | string): React.ReactNode {
    if (typeof(msg) !== "string") {
        return msg as React.ReactNode;
    }

    const lines = (msg as string).split("\n").map(line => line.trim());
    return (
        <div>
            {lines.map((line, index) => 
                <p key={index}>
                    {line}
                </p>
            )}
        </div>
    );
}

@InjectableSingleton(INotificationId)
export class Notification implements INotification {
    
    toaster: IToaster;

    constructor() {
        this.toaster = Toaster.create();
    }

    //
    // Notify the user.
    //
    notify(params: INotificationParams): void { 
        
        let msg = prepMessage(params.msg);

        let toastId: string;

        if (params.actions && params.actions.length > 1) {
            msg = (
                <div>
                    {msg}

                    <br/>

                    {params.actions.map(action => {
                        return (
                            <div className="bp3-button-group bp3-minimal">
                                <a
                                    role="button" 
                                    className="bp3-button"
                                    onClick={async () => {
                                        this.toaster.dismiss(toastId);
                                        await action.callback();
                                    }}
                                    >
                                    <span className="bp3-button-text">
                                        {action.text}
                                    </span>
                                </a>
                            </div>                            
                        );
                    })}
                </div>
            );
        }

        toastId = this.toaster.show({
            icon: getIcon(params.level),
            message: msg,
            intent: levelToIntent(params.level),
            action: params.actions && params.actions.length === 1 
                && { 
                    text: params.actions[0].text, 
                    onClick: params.actions[0].callback,
                } 
                || undefined,
            timeout: params.duration,
        });
    }

    //
    // Give the user an informational message.
    //
    info(msg: any, actions?: IAction[]): void {
        this.notify({
            level: Level.Info,
            msg: msg,
            actions,
            duration: 100000,
        });
    }

    //
    // Issue a warning to the user.
    //
    warn(msg: any, actions?: IAction[]): void {
        this.notify({
            level: Level.Warn,
            msg: msg,
            actions,
            duration: 15000,
        });
    }

    //
    // Issue an error to the user.
    //
    error(msg: any): void {
        this.notify({
            level: Level.Error,
            msg: msg,
            duration: 100000,
        });
    }

    //
    // Report an exception to the user.
    //
    exception(msg: any, err: any): void {
        this.error(`${msg}\r\n${err.stack || err.messsage || serializeError(err)}`);
    }

    //
    // Issue a success msg to the user.
    //
    success(msg: any, actions?: IAction[]): void {
        this.notify({
            level: Level.Success,
            msg: msg,
            actions,
            duration: 100000,
        });
    }
}

