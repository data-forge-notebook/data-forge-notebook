//
// A service for accessing details on the platform.
//

export interface IPlatform {

    //
    // Get the name of the platform.
    //
    getName(): string;

    //
    // Get the release of the platform.
    //
    getRelease(): string;

    //
    // Get the architecture.
    //
    getArch(): string;

    //
    // Returns true when running under the browser.
    //
    isBrowser(): boolean;

    //
    // Returns true when running on Windows.
    //
    isWindows(): boolean;

    //
    // Returns true when running on MacOS.
    //
    isMacOS(): boolean;

    //
    // Returns true when running on Linux.
    //
    isLinux(): boolean;
}
