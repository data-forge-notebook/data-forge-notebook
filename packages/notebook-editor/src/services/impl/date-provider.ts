import { InjectableSingleton } from "@codecapers/fusion";
import { IDateProvider, IDateProviderId } from "../date-provider";

//
// Dependency injected global variables.
//
@InjectableSingleton(IDateProviderId)
export class DateProvider implements IDateProvider {

    //
    // Get the date/time at this moment.
    //
    now(): Date {
        return new Date();
    }
}