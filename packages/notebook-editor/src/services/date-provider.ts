//
// A service that provides the current date.
//

export const IDateProviderId = "IDateProvider";

export interface IDateProvider {

    //
    // Get the date/time at this moment.
    //
    now(): Date;
}