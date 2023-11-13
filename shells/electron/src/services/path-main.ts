//
// Service for getting various paths.
//

import { InjectableSingleton } from "@codecapers/fusion";
import * as path from 'path';
import * as os from "os";
import { app } from "electron";
import { IPaths, IPaths_ID } from "notebook-editor/build/services/paths";

const platform = os.platform();
const isMacOS = platform === "darwin";

//
// Gets the path for data installed with the application.
//
export function getInstallPath(): string {
    if (process.env.INSTALL_PATH) {
        // Override for development and testing.
        return process.env.INSTALL_PATH;
    }

    if (isMacOS) {
        // Go two levels up from the exe on MacOS.
        return path.dirname(path.dirname(app.getPath("exe")));
    }
    else {
        return path.dirname(app.getPath("exe"));
    }
}

//
// Gets the local install path for Node.js.
//
export function getNodejsInstallPath(): string {
    const installPath = getInstallPath();
    const nodeJsPath = `${installPath}/nodejs`;
    return nodeJsPath;
}

@InjectableSingleton(IPaths_ID)
export class Paths implements IPaths {

    //
    // Gets the current working directory.
    //
    getWorkingDirectory() {
        return process.cwd();
    }

    //
    // Get the path for example notebooks.
    //
    getExamplesPath(): string {
        // Prod only.
        return path.join(getInstallPath(), "resources/notebooks");

        // Dev only.
        // const examplesPath = path.resolve(process.cwd(), "..", "..", "notebooks", "examples");
        // return examplesPath;
    }
}
