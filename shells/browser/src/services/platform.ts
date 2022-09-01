//
// A service for accessing details on the platform.
//

import { InjectableSingleton } from "@codecapers/fusion";
import { IPlatform, IPlatformId } from "notebook-editor";

@InjectableSingleton(IPlatformId)
export class Platform implements IPlatform {

    //
    // Get the name of the platform.
    //
    getName(): string {
        return "browser";
    }

    //
    // Get the release of the platform.
    //
    getRelease(): string {
        return "browser";
    }

    //
    // Get the architecture.
    //
    getArch(): string {
        return "browser";
    }

    //
    // Returns true when running under the browser.
    //
    isBrowser(): boolean {
        return true;
    }

    //
    // Returns true when running on Windows.
    //
    isWindows(): boolean {
        return false;
    }

    //
    // Returns true when running on MacOS.
    //
    isMacOS(): boolean {
        return false;
    }

    //
    // Returns true when running on Linux.
    //
    isLinux(): boolean {
        return false;
    }
}
