import { Button } from "@blueprintjs/core";
import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import * as React from "react";
import { commands, humanizeAccelerator } from "../services/command";
import { IPlatform, IPlatformId } from "../services/platform";

export interface IHotkey {
    //
    // The name of the key.
    //
    key: string;

    //
    // Description of the key.
    //
    desc: string;
}

export interface IHotkeyOverlayProps {
    //
    // Event raised to close the overlay.
    //
    onClose: () => void;
}

export interface IHotkeyOverlayState {

}

@InjectableClass()
export class HotkeysOverlay extends React.Component<IHotkeyOverlayProps, IHotkeyOverlayState> {

    @InjectProperty(IPlatformId)
    platform!: IPlatform;

    //
    // Format hotkeys for display to the user.
    //
    private formatHotkeys(): IHotkey[] {
        return commands
            .filter(commmand => commmand.getAccelerator())
            .map(command => ({
                key: humanizeAccelerator(command.getAccelerator(), this.platform)!,
                desc: command.getDesc(),
            }));
    }

    render() {
        const hotkeys = this.formatHotkeys();
        const keysCol1 = hotkeys.filter((hotkey, index) => (index+1) % 2);
        const keysCol2 = hotkeys.filter((hotkey, index) => index % 2);

        return (
            <div
                style={{
                    position: "fixed",
                    left: 0,
                    right: 0,
                    top: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.5)",
                    zIndex: 8000,
                }}
                onClick={() => this.props.onClose()}
                >
                <div
                    style={{
                        position: "fixed",
                        left: 0,
                        right: 0,
                        top: 0,
                        bottom: 0,
                        minWidth: "1000px",
                        maxWidth: "90%",
                        maxHeight: "90%",
                        margin: "auto",
                        backgroundColor: "white",
                        color: "#676767",
                        zIndex: 9000,
                        boxShadow: "0 4px 12px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.5)",
                        borderRadius: "3px",
                    }}
                    onClick={(evt: any) => {
                        evt.stopPropagation();
                    }}
                        >    
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                            padding: "5px",
                        }}
                        >
                        <div 
                            style={{
                                display: "flex",
                                flexDirection: "row",
                                alignItems: "center",
                                borderBottom: "solid 2px #ccc",
                                marginLeft: "15px",
                                marginRight: "15px",
                            }}
                            >
                            <div
                                style={{
                                    display: "flex",
                                    flexDirection: "row",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    flexGrow: 1,
                                }}
                                >
                                <h1>Keyboard Shortcuts</h1> 
                                <div 
                                    style={{
                                        color: "#555",
                                        lineHeight: "1.5",
                                        backgroundImage: "linear-gradient(#f5f5f5 0%, #eee 100%)",
                                        padding: "0 8px",
                                        border: "1px solid #ccc",
                                        backgroundColor: "#eee",
                                        backgroundRepeat: "repeat-x",
                                        borderRadius: "3px",
                                        boxShadow: "inset 0 1px 0 #fff, 0 1px 0 #ccc",
                                        marginLeft: "15px",
                                    }}
                                    >
                                    Ctrl+Shift+/
                                </div>
                            </div>

                            <Button
                                style={{
                                    fontSize: "1.8em",
                                    cursor: "pointer",
                                }}
                                minimal
                                onClick={async (evt: any) => {
                                    evt.stopPropagation();
                                    this.props.onClose();
                                }}
                                >
                                ×
                            </Button>
                        </div>

                        <div
                            className="flex-grow"
                            style={{
                                marginTop: "30px",
                                overflow: "auto",
                            }}
                            >
                            <div className="flex flex-row items-start">
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                        padding: "15px",
                                        width: "250px",
                                        flexGrow: 1,
                                    }}
                                    >
                                    {keysCol1.map(hotkey => (
                                        <div
                                            key={hotkey.key}
                                            style={{
                                                display: "flex",
                                                flexDirection: "row",
                                                alignItems: "center",
                                                marginBottom: "20px",
                                            }}
                                            >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "row",
                                                    justifyItems: "left",
                                                    width: "160px",
                                                }}
                                                >
                                                <div 
                                                    style={{
                                                        color: "#555",
                                                        lineHeight: "1.5",
                                                        backgroundImage: "linear-gradient(#f5f5f5 0%, #eee 100%)",
                                                        padding: "2px 8px",
                                                        border: "1px solid #ccc",
                                                        backgroundColor: "#eee",
                                                        backgroundRepeat: "repeat-x",
                                                        borderRadius: "3px",
                                                        boxShadow: "inset 0 1px 0 #fff, 0 1px 0 #ccc",
                                                        marginLeft: "15px",
                                                    }}
                                                    >
                                                    {hotkey.key}
                                                </div>
                                            </div>
                                            <div style={{ marginLeft: "15px" }}>
                                                {hotkey.desc}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div
                                    style={{
                                        display: "flex",
                                        flexDirection: "column",
                                        alignItems: "flex-start",
                                        padding: "15px",
                                        width: "250px",
                                        flexGrow: 1,
                                    }}
                                    >
                                    {keysCol2.map(hotkey => (
                                        <div
                                            key={hotkey.key}
                                            style={{
                                                display: "flex",
                                                flexDirection: "row",
                                                alignItems: "center",
                                                marginBottom: "20px",
                                            }}
                                            >
                                            <div
                                                style={{
                                                    display: "flex",
                                                    flexDirection: "row",
                                                    justifyItems: "left",
                                                    width: "160px",
                                                }}
                                                >
                                                <div 
                                                    style={{
                                                        color: "#555",
                                                        lineHeight: "1.5",
                                                        backgroundImage: "linear-gradient(#f5f5f5 0%, #eee 100%)",
                                                        padding: "2px 8px",
                                                        border: "1px solid #ccc",
                                                        backgroundColor: "#eee",
                                                        backgroundRepeat: "repeat-x",
                                                        borderRadius: "3px",
                                                        boxShadow: "inset 0 1px 0 #fff, 0 1px 0 #ccc",
                                                        marginLeft: "15px",
                                                    }}
                                                    >
                                                    {hotkey.key}
                                                </div>
                                            </div>
                                            <div style={{ marginLeft: "15px" }}>
                                                {hotkey.desc}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}