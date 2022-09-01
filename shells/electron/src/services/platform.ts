//
// A service for accessing details on the platform.
//

import { InjectableSingleton } from "@codecapers/fusion";
import { IPlatform, IPlatformId } from "notebook-editor/build/services/platform";
import * as os from 'os';

@InjectableSingleton(IPlatformId)
export class Platform implements IPlatform {

    private static platform = os.platform();
    private static _isWindows = Platform.platform === "win32";
    private static _isMacOS = Platform.platform === "darwin";
    private static _isLinux = Platform.platform === "linux";

    //
    // Get the name of the platform.
    //
    getName(): string {
        return Platform.platform;
    }

    //
    // Get the release of the platform.
    //
    getRelease(): string {
        return os.release();
    }

    //
    // Get the architecture.
    //
    getArch(): string {
        return os.arch();
    }

    //
    // Returns true when running under the browser.
    //
    isBrowser(): boolean {
        return false;
    }

    //
    // Returns true when running on Windows.
    //
    static isWindows(): boolean {
        return Platform._isWindows;
    }

    //
    // Returns true when running on Windows.
    //
    isWindows(): boolean {
        return Platform._isWindows;
    }

    //
    // Returns true when running on MacOS.
    //
    static isMacOS(): boolean {
        return Platform._isMacOS;
    }

    //
    // Returns true when running on MacOS.
    //
    isMacOS(): boolean {
        return Platform._isMacOS;
    }

    //
    // Returns true when running on Linux.
    //
    static isLinux(): boolean {
        return Platform._isLinux;
    }

    //
    // Returns true when running on Linux.
    //
    isLinux(): boolean {
        return Platform._isLinux;
    }
}
