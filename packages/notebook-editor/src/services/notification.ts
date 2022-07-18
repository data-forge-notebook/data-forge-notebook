//
// The level of the notification.
//
export enum Level {
    Info = "info",
    Success = "success",
    Warn = "warning",
    Error = "error",
}

//
// An action the user can trigger from a notification.
//
export interface IAction {
    text: string;
    callback: () => Promise<void>;
}

//
// Parameters for each notification.
//
export interface INotificationParams {
    level: Level | string;
    msg: any;
    duration?: number;
    actions?: IAction[];
}

//
// The ID for the notification service.
//
export const INotificationId = "INotification";

//
// Service for displaying notifications to the user.
//
export interface INotification {
    //
    // Notify the user.
    //
    notify(params: INotificationParams): void;

    //
    // Give the user an informational message.
    //
    info(msg: any, actions?: IAction[]): void;

    //
    // Issue a warning to the user.
    //
    warn(msg: any): void;

    //
    // Issue an error to the user.
    //
    error(msg: any): void;

    //
    // Report an exception to the user.
    //
    exception(msg: any, err: any): void;

    //
    // Issue a success msg to the user.
    //
    success(msg: any, actions?: IAction[]): void;
}

