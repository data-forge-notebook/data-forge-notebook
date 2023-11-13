import { InjectableSingleton, InjectProperty } from "@codecapers/fusion";
import { ISettings, ISettings_ID, IZoom, IZoomId } from "notebook-editor";

//
// Service for interacting with the operating system clipboard.
//
@InjectableSingleton(IZoomId)
export class Zoom implements IZoom {

    init(): void {
    }

    deinit(): void {
    }

    //
    // Zoom in.
    //
    zoomIn(): void {
    }

    //
    // Zoom out.
    //
    zoomOut(): void {
    }

    //
    // Reset to normal zoom.
    //
    resetZoom(): void {
    }
}
