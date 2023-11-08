const webFrame = require('electron').webFrame;
import { InjectableSingleton, InjectProperty } from "@codecapers/fusion";
import { ISettings, ISettings_ID, IZoom, IZoomId } from "notebook-editor";

//
// Service for interacting with the operating system clipboard.
//
@InjectableSingleton(IZoomId)
export class Zoom implements IZoom {

    //
    // Current zoom level.
    //
    private curZoomLevel: number = 0;

    @InjectProperty(ISettings_ID)
    settings!: ISettings;

    constructor() {
        this.onSettingsChanged = this.onSettingsChanged.bind(this);
    }

    //
    // Update zoom from settings.
    private updateZoom() {
        let zoom = this.settings.get<number>("zoom");
        if (zoom === undefined) {
            return;
        }        

        if (zoom !== this.curZoomLevel) {
           
            this.curZoomLevel = zoom;
            webFrame.setZoomLevel(this.curZoomLevel);
        }
    }

    init(): void { //TODO: This really wants to be abstracted behind a view model!
        this.settings.onSettingsChanged.attach(this.onSettingsChanged);

        this.updateZoom();
    }

    deinit(): void {
        this.settings.onSettingsChanged.detach(this.onSettingsChanged);
    }

    async onSettingsChanged(key: string): Promise<void> {
        if (key === "zoom") {
            this.updateZoom();
        }
    }

    //
    // Zoom in.
    //
    zoomIn(): void {
        const newZoomLevel = webFrame.getZoomLevel()+1;
        webFrame.setZoomLevel(newZoomLevel);
        this.settings.set("zoom", newZoomLevel);
    }

    //
    // Zoom out.
    //
    zoomOut(): void {
        const newZoomLevel = webFrame.getZoomLevel()-1;
        webFrame.setZoomLevel(newZoomLevel);
        this.settings.set("zoom", newZoomLevel);
    }

    //
    // Reset to normal zoom.
    //
    resetZoom(): void {
        const newZoomLevel = 0;
        webFrame.setZoomLevel(newZoomLevel);
        this.settings.set("zoom", newZoomLevel);
    }
}
