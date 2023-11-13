//
// Service for getting various paths.
//

import { InjectableSingleton, InjectProperty } from "@codecapers/fusion";
import { IPaths, IPaths_ID } from "notebook-editor";

@InjectableSingleton(IPaths_ID)
export class Paths implements IPaths {

    //
    // Gets the current working directory.
    //
    getWorkingDirectory() {
        return "working/directory";
    }

    //
    // Get the path for example notebooks.
    //
    getExamplesPath(): string {
        return "examples/path";
    }
}
