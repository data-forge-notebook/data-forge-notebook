import * as React from "react";
import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { updateState } from "browser-utils";
import { INotebookEditorViewModel } from "../../view-model/notebook-editor";
import { NotebookUI } from "./notebook";
import { Toolbar } from "../toolbar";
import { HotkeysOverlay } from "../../components/hotkeys-overlay";
import FuzzyPicker from "../../lib/fuzzy-picker/fuzzy-picker";
import { ICommander, ICommanderId } from "../../services/commander";
import { humanizeAccelerator, ICommand } from "../../services/command";
import { IPlatform, IPlatformId } from "../../services/platform";
import * as path from "path";
import { IRecentFiles, IRecentFiles_ID } from "../../services/recent-files";
import { WelcomeScreen } from "./welcome-screen";
import { observer } from "mobx-react";
import { IExampleNotebook, INotebookRepositoryId, INotebookRepository } from "../../services/notebook-repository";

export interface INotebookEditorProps {
    //
    // The view model for the notebook editor.
    //
    notebookEditor: INotebookEditorViewModel;
}

export interface INotebookEditorState {
    //
    // List of example noteboks.
    //
    exampleNotebooks?: IExampleNotebook[];
}

@InjectableClass()
class NotebookEditorView extends React.Component<INotebookEditorProps, INotebookEditorState> {

    @InjectProperty(ICommanderId)
    commander!: ICommander;

    @InjectProperty(IPlatformId)
    platform!: IPlatform;

    @InjectProperty(INotebookRepositoryId)
    notebookRepository!: INotebookRepository;

    @InjectProperty(IRecentFiles_ID)
    recentFiles!: IRecentFiles;

    constructor (props: INotebookEditorProps) {
        super(props);

        this.state = {};
    }

    private onOpenNotebookChanged = async (isReload: boolean): Promise<void> => {
        if (!isReload) {
            document.documentElement.scrollTop = 0;
        }
    }

    async componentDidMount() {
        this.props.notebookEditor.onOpenNotebookChanged.attach(this.onOpenNotebookChanged);

        const exampleNotebooks = await this.notebookRepository.getExampleNotebooks();
        await updateState(this, {
            exampleNotebooks: exampleNotebooks,
        });

        this.props.notebookEditor.mount();
    }

    componentWillUnmount(): void {
        this.props.notebookEditor.onOpenNotebookChanged.detach(this.onOpenNotebookChanged);

        this.props.notebookEditor.unmount();
    }

    //
    // Opens a recent notebook.
    //
    private openRecentFile = async (filePath: string): Promise<void> => {
        await this.props.notebookEditor.toggleRecentFilePicker();
        const notebookStorageId = this.notebookRepository.idFromString(filePath);
        await this.props.notebookEditor.openSpecificNotebook(notebookStorageId);
    }

    //
    // Gets the list of recent files.
    //
    private getRecentFiles(): string[] {
        return this.recentFiles.getRecentFileList();
    }

    //
    // Invokes a comnmand against the editor.
    //
    private invokeCommand = async (command: ICommand): Promise<void> => {
        const notebook = this.props.notebookEditor.notebook;
        const selectedCell = notebook ? notebook.selectedCell : undefined;

        if (selectedCell) {
            await this.commander.invokeCommand(command, { cell: selectedCell });
        }
        else {
            await this.commander.invokeCommand(command);
        }
    }

    //
    // Opens an example notebook.
    //
    private openExampleNotebook = async (exampleNotebook: IExampleNotebook): Promise<void> => {
        await this.props.notebookEditor.toggleExamplesBrowser();
        await this.props.notebookEditor.openSpecificNotebook(exampleNotebook.storageId);
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
                            notebookEditor={this.props.notebookEditor} 
                            />
                    </div>

                    <div 
                        className="flex flex-col"
                        style={{ 
                            marginTop: "4px",
                        }}
                        >
                        {this.props.notebookEditor.notebook
                            ? <NotebookUI
                                key={this.props.notebookEditor.notebook.instanceId}
                                notebook={this.props.notebookEditor.notebook} 
                                />
                            : <WelcomeScreen
                                model={this.props.notebookEditor}
                                />
                        }
                        
                    </div>
                </div>

                {this.state.exampleNotebooks 
                        && <FuzzyPicker
                        label="Example browser"
                        isOpen={this.props.notebookEditor.showExampleBrowser}
                        onClose={() => this.props.notebookEditor.toggleExamplesBrowser()}
                        autoCloseOnEnter={true}
                        onChange={this.openExampleNotebook}
                        items={this.state.exampleNotebooks}
                        showAllItems={true}
                        renderItem={(exampleNotebook: IExampleNotebook) => 
                            <div className="flex flex-row">
                                <div className="flex flex-col flex-grow">
                                    <div>{exampleNotebook.name}</div>
                                    <div
                                        style={{
                                            fontSize: "0.8em",
                                        }}
                                        >
                                        {exampleNotebook.description}
                                    </div>
                                </div>
                            </div>    
                        }
                        itemValue={(exampleNotebook: IExampleNotebook) => `${exampleNotebook.name} ${exampleNotebook.description}`}
                        pickExactItem={true}
                        />
                }

                <FuzzyPicker
                    label="Recent files"
                    isOpen={this.props.notebookEditor.showRecentFilePicker}
                    onClose={() => this.props.notebookEditor.toggleRecentFilePicker()}
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
                    isOpen={this.props.notebookEditor.showCommandPalette}
                    onClose={() => this.props.notebookEditor.toggleCommandPalette()}
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

                {this.props.notebookEditor.showHotkeysOverlay 
                    && <HotkeysOverlay 
                        onClose={() => this.props.notebookEditor.toggleHotkeysOverlay()}
                        />
                }
            </div>
        );
    }
}

export const NotebookEditor = observer(NotebookEditorView);