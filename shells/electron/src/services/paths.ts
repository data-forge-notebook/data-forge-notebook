//
// Service for getting various paths.
//

import { InjectableSingleton, InjectProperty } from "@codecapers/fusion";
import { IPaths, IPaths_ID } from "notebook-editor";
import * as path from 'path';

const remote = require("@electron/remote");
const app = remote.app;

@InjectableSingleton(IPaths_ID)
export class Paths implements IPaths {

    //
    // Get the path for example notebooks.
    //
    getExamplesPath(): string {
        // Prod only.
        return path.join(app.getPath("userData"), "resources/notebooks");

        // Dev only.
        // const examplesPath = path.resolve(process.cwd(), "..", "..", "notebooks", "examples");
        // return examplesPath;
    }
}
