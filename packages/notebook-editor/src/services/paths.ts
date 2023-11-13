//
// Service for getting various paths.
//

export const IPaths_ID = "IPaths";

export interface IPaths {

    //
    // Gets the current working dircetory.
    //
    getWorkingDirectory(): string;

    //
    // Get the path for example notebooks.
    //
    getExamplesPath(): string;

}
