import * as React from "react";
import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { forceUpdate, updateState } from "browser-utils";
import { INotebookEditorViewModel } from "../../view-model/notebook-editor";
import { NotebookUI } from "./notebook";
import { Toolbar } from "../toolbar";
import { HotkeysOverlay } from "../../components/hotkeys-overlay";
import FuzzyPicker from "../../lib/fuzzy-picker/fuzzy-picker";
import { ICommander, ICommanderId } from "../../services/commander";
import { humanizeAccelerator, ICommand } from "../../services/command";
import { IPlatform, IPlatformId } from "../../services/platform";
import * as path from "path";
import { INotebookRepository, INotebookRepositoryId } from "storage";
import { IRecentFiles, IRecentFiles_ID } from "../../services/recent-files";
import { WelcomeScreen } from "./welcome-screen";

export interface INotebookEditorProps {
    model: INotebookEditorViewModel;
}

export interface INotebookEditorState {
    //
    // Set to true to display settings.
    //
    isSettingsOpen: boolean;

    //
    // Records the initial tab to display in the settings dialog.
    //
    initialSettingsTab?: string;

    //
    // Set to true to display the cmd palette.
    //
    isCommandPaletteOpen: boolean;

    //
    // Set to true to display the recent files picker.
    //
    isRecentFilesPickerOpen: boolean;

}

@InjectableClass()
export class NotebookEditor extends React.Component<INotebookEditorProps, INotebookEditorState> {

    @InjectProperty(ICommanderId)
    commander!: ICommander;

    @InjectProperty(IPlatformId)
    platform!: IPlatform;

    @InjectProperty(INotebookRepositoryId)
    notebookRepository!: INotebookRepository;

    @InjectProperty(IRecentFiles_ID)
    recentFiles!: IRecentFiles;

    constructor (props: any) {
        super(props);

        this.state = {
            isSettingsOpen: false,
            isCommandPaletteOpen: false,
            isRecentFilesPickerOpen: false,
        };
    }

    private onOpenNotebookChanged = async (isReload: boolean): Promise<void> => {
        await forceUpdate(this);

        if (!isReload) {
            document.documentElement.scrollTop = 0;
        }
    }

    componentDidMount() {
        this.props.model.onOpenNotebookChanged.attach(this.onOpenNotebookChanged);
        this.props.model.onToggleCommandPalette.attach(this.toggleCommandPalette);
        this.props.model.onToggleRecentFilePicker.attach(this.toggleRecentFilesPicker);

        this.props.model.mount();
    }

    componentWillUnmount(): void {
        this.props.model.onOpenNotebookChanged.detach(this.onOpenNotebookChanged);
        this.props.model.onToggleCommandPalette.detach(this.toggleCommandPalette);
        this.props.model.onToggleRecentFilePicker.detach(this.toggleRecentFilesPicker);

        this.props.model.unmount();
    }

    private closeRecentFilesPicker = async (): Promise<void> => {
        await updateState(this, { isRecentFilesPickerOpen: false });
    }

    private toggleRecentFilesPicker = async (): Promise<void> => {
        await updateState(this, { isRecentFilesPickerOpen: !this.state.isRecentFilesPickerOpen });
    }

    //
    // Opens a recent notebook.
    //
    private openRecentFile = async (filePath: string): Promise<void> => {
        await this.closeRecentFilesPicker();
        const notebookStorageId = this.notebookRepository.idFromString(filePath);
        await this.props.model.openSpecificNotebook(notebookStorageId);

    }

    //
    // Gets the list of recent files.
    //
    private getRecentFiles(): string[] {
        return this.recentFiles.getRecentFileList();
    }

    private closeCommandPalette = async (): Promise<void> => {
        await updateState(this, { isCommandPaletteOpen: false });
    }

    private toggleCommandPalette = async (): Promise<void> => {
        await updateState(this, { isCommandPaletteOpen: !this.state.isCommandPaletteOpen });
    }

    private invokeCommand = async (command: ICommand): Promise<void> => {
        const notebook = this.props.model.isNotebookOpen() ? this.props.model.getOpenNotebook() : undefined;
        const selectedCell = notebook ? notebook.getSelectedCell() : undefined;

        if (selectedCell) {
            await this.commander.invokeCommand(command, { cell: selectedCell });
        }
        else {
            await this.commander.invokeCommand(command);
        }

        if (command.getId() !== "toggle-command-palette") {
            // Always close the command palette after a command is executed.
            // Unless the command itself was the one that opened the command palette.
            await this.closeCommandPalette();
        }
    }

    render () {
        return (
            <div 
                className="pos-relative border" 
                >
                <div>
                    <div
                        style={{ 
                            position: "sticky", 
                            left: 0, 
                            right: 0, 
                            top: 0,
                            zIndex: 2000,
                        }}
                        >
                        <Toolbar 
                            model={this.props.model} 
                            />
                    </div>

                    <div 
                        className="flex flex-col"
                        style={{ 
                            marginTop: "4px",
                        }}
                        >
                        {this.props.model.isNotebookOpen()
                            ? <NotebookUI
                                key={this.props.model.getOpenNotebook().getInstanceId()}
                                model={this.props.model.getOpenNotebook()} 
                                />
                            : <WelcomeScreen
                                model={this.props.model}
                                />
                        }
                        
                    </div>
                </div>

                <FuzzyPicker
                        label="Recent files"
                        isOpen={this.state.isRecentFilesPickerOpen}
                        onClose={this.closeRecentFilesPicker}
                        autoCloseOnEnter={true}
                        onChange={this.openRecentFile}
                        items={this.getRecentFiles()}
                        showAllItems={true}
                        renderItem={(filePath: string) => 
                            <div className="flex flex-row">
                                <div className="flex flex-col flex-grow">
                                    <div>{path.basename(filePath)}</div>
                                    <div
                                        style={{
                                            fontSize: "0.8em",
                                        }}
                                        >
                                        {path.dirname(filePath)}
                                    </div>
                                </div>
                            </div>    
                        }
                        itemValue={(filePath: string) => filePath}
                        pickExactItem={true}
                        />

                <FuzzyPicker
                        label="Commands"
                        isOpen={this.state.isCommandPaletteOpen}
                        onClose={this.closeCommandPalette}
                        autoCloseOnEnter={true}
                        onChange={this.invokeCommand}
                        items={this.commander.getCommands()}
                        showAllItems={true}
                        renderItem={(command: ICommand) => 
                            <div className="flex flex-row">
                                <div className="flex flex-col flex-grow">
                                    <div>{command.getLabel().replace(/&/g, "")}</div>
                                    <div
                                        style={{
                                            fontSize: "0.8em",
                                        }}
                                        >
                                        {command.getDesc()}
                                    </div>
                                </div>
                                <div>{humanizeAccelerator(command.getAccelerator(), this.platform)}</div>
                            </div>    
                        }
                        itemValue={(command: ICommand) => command.getDesc()}
                        pickExactItem={true}
                        />

                <HotkeysOverlay model={this.props.model} />

            </div>
        );
    }
}