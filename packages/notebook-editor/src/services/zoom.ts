//
// Service for zooming the app.
//

export const IZoomId = "IZoom";

export interface IZoom {

    init(): void;

    deinit(): void;
    
    //
    // Zoom in.
    //
    zoomIn(): void;

    //
    // Zoom out.
    //
    zoomOut(): void;

    //
    // Reset to normal zoom.
    //
    resetZoom(): void;
}
