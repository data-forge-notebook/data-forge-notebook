import * as React from 'react';
import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import * as path from 'path';
import { INotebookEditorViewModel } from '../../view-model/notebook-editor';
import { IRecentFiles, IRecentFiles_ID } from '../../services/recent-files';
import { ICommander, ICommanderId } from '../../services/commander';
import { ISettings, ISettings_ID } from '../../services/settings';
import { IOpen, IOpen_ID } from '../../services/open';
import { asyncHandler, ILog, ILogId } from 'utils';
import { updateState } from 'browser-utils';
import { INotebookRepository, INotebookRepositoryId } from 'storage';
import { Button } from '@blueprintjs/core';
import { IPaths, IPaths_ID } from '../../services/paths';

const headingStyle = {
    fontSize: "1.2em",
};

const textStyle = {
    fontSize: "0.9em",
};

const bigTextStyle = {
    fontSize: "1em",
};

export interface IWelcomeScreenProps {
    model: INotebookEditorViewModel;
}

export interface IWelcomeScreenState {
    //
    // Set to true to show the getting started section.
    //
    showGettingStarted: boolean;
}

@InjectableClass()
export class WelcomeScreen extends React.Component<IWelcomeScreenProps, IWelcomeScreenState> {

    @InjectProperty(IRecentFiles_ID)
    recentFiles!: IRecentFiles;

    @InjectProperty(ICommanderId)
    commander!: ICommander;

    @InjectProperty(ISettings_ID)
    settings!: ISettings;

    @InjectProperty(IOpen_ID)
    open!: IOpen;

    @InjectProperty(ILogId)
    log!: ILog;

    @InjectProperty(INotebookRepositoryId)
    notebookRepository!: INotebookRepository;

    @InjectProperty(IPaths_ID)
    paths!: IPaths;

    constructor (props: IWelcomeScreenProps) {
        super(props);

        this.state = {
            showGettingStarted: true,
        };

        this.componentDidMount = asyncHandler(this, this.componentDidMount);
    }

    async componentDidMount() {
        setTimeout(() => {
            requestAnimationFrame(() => {
                // Hack to wait until window is rendered before we let the main process
                // know it's ready to be showed.
                this.log.info("$$ Editor window is ready!");
                this.props.model.notifyEditorReady();
            });
        }, 100);

        await updateState(this, { 
            showGettingStarted: !this.settings.get("hideGettingStarted"),
        });
    }

    makeNotebookLink(name: string, filePath: string, showPath: boolean) {
        let formattedFilePath = filePath.replace(/\\/g, "/");
        formattedFilePath = encodeURI(formattedFilePath);
        const notebookStorageId = this.notebookRepository.idFromString(filePath);
        return (
            <a onClick={() => this.props.model.openSpecificNotebook(notebookStorageId)}>
                {name} 
                {showPath 
                    && <span>&nbsp;({(path.dirname(filePath))})</span>
                }
            </a>
        );
    }

    //
    // Make a link to upgrade the user from free to pro.
    //
    makeLandingPageLink(): string {
        return `https://www.data-forge-notebook.com`;
    }
    
    render() {
        const examplesPath = this.paths.getExamplesPath();
        const exampleNotebooks: [string, string][] = [
            ["Intro notebook", path.join(examplesPath, "intro.notebook")],
            ["Visualization example", path.join(examplesPath, "viz.notebook")],
            ["Charts example", path.join(examplesPath, "charts.notebook")],
            ["Maps example", path.join(examplesPath, "maps.notebook")],
            ["CSV example", path.join(examplesPath, "csv-file-example.notebook")],
            ["JSON example", path.join(examplesPath, "json-file-example.notebook")],
            ["REST API example", path.join(examplesPath, "rest-api-example.notebook")],
        ];

        const recentFiles = this.recentFiles.getRecentFileList();
        const showRecentFiles = recentFiles.length > 0;
        
        const titleStyle =  { fontSize: "4em" };
        const subTitleStyle =  { fontSize: "1.25em" };
    
        return (
            <div 
                className="flex flex-col"
                style={{
                    width: "100%",
                    minWidth: "600px",
                    maxWidth: "1000px",
                    marginLeft: "auto",
                    marginRight: "auto",
                }}
                >
                <div
                    className="flex flex-row"
                    >
                    <div className="flex-grow" />
                    <div
                        className="text-white rounded ml-3 mt-3 mb-4"
                        style={{
                            backgroundColor: "#4182E4",
                        }}
                        >
                        <div 
                            className="flex flex-row items-center ml-8 mr-8 mt-8"
                            >
                            <img src="logo.png" />
                            <div className="flex-grow" />
                        </div>
                        <div
                            className="mt-4 mb-5 ml-8 mr-8"
                            style={subTitleStyle}
                            >
                            Exploratory coding and data analysis for JavaScript
                        </div>
                    </div>
                    <div className="flex-grow" />
                </div>

                { this.state.showGettingStarted
                    && <div 
                        className="flex flex-col flex-grow ml-2 mr-2 mb-3 p-1 pl-2"
                        style={{
                            border: "1px dashed #C5DAE9",
                            backgroundColor: "#F8F8F8",
                            borderRadius: "3px",
                        }}
                        >
                        <div
                            className="flex flex-row items-center"
                            style={headingStyle}
                            >
                            <div className="flex-grow">
                                Getting started
                            </div>
                            <Button
                                icon="cross"
                                minimal
                                onClick={() => {
                                    this.setState({
                                        showGettingStarted: false,
                                    });
                                    this.settings.set("hideGettingStarted", true);
                                }}
                                />
                        </div>

                        <div className="ml-2 mr-2 mb-2">
                            <iframe 
                                width="560" height="315"
                                src="https://video.data-forge-notebook.com/getting-started"
                                allow="autoplay; encrypted-media;" 
                                >
                            </iframe>
                        </div>
                        <div style={bigTextStyle}>
                            <p>
                                Watch the 
                                <a  
                                    className="ml-1 mr-1"
                                    target="_blank"
                                    href="https://video.data-forge-notebook.com/getting-started"
                                    >
                                    Getting Started Video
                                </a>
                                online, read the
                                <a  
                                    className="ml-1"
                                    target="_blank"
                                    href="https://wiki.data-forge-notebook.com/getting-started"
                                    >
                                    Getting Started Guide
                                </a>
                                , or open the {this.makeNotebookLink("Intro notebook", path.join(examplesPath, "intro.notebook"), false)}.
                            </p>
                        </div>
                    </div>
                }

                { showRecentFiles
                    && <div 
                        className="flex flex-row flex-grow ml-2 mr-2 mb-3"
                        >
                        <div 
                            className="flex flex-col flex-grow p-1 pl-2 m-1"
                            style={{
                                border: "1px dashed #C5DAE9",
                                backgroundColor: "#F8F8F8",
                                borderRadius: "3px",
                            }}
                            >
                            <div className="mb-1"
                                style={headingStyle}
                                >
                                Recent notebooks
                            </div>
                            <div 
                                style={textStyle}
                                >
                                {recentFiles.slice(0, 4).map((filePath, index) =>
                                    <div key={index}>
                                        {this.makeNotebookLink(path.basename(filePath), filePath, true)}
                                    </div>
                                )}
                            </div>
                            {/* <div style={bigTextStyle} className="mt-1">
                                <a 
                                    onClick={() => {
                                        this.commander.invokeNamedCommand("clear-recent-files");
                                        this.forceUpdate();
                                    }}
                                    >
                                    Clear recent files
                                </a>
                            </div> */}
                            <div style={bigTextStyle} className="mt-1">
                                <a onClick={() => this.commander.invokeNamedCommand("toggle-recent-file-picker")}>
                                    Browse recent notebooks
                                </a>
                            </div>

                        </div>
                    </div>
                }

                <div className="flex flex-row w-full mb-32">
                    <div className="flex flex-col w-1/2">
                        <div 
                            className="flex flex-col ml-2 mr-2 mb-3 p-1 pl-2"
                            style={{
                                border: "1px dashed #C5DAE9",
                                backgroundColor: "#F8F8F8",
                                borderRadius: "3px",
                            }}
                            >
                            <div
                                className="mb-1"
                                style={headingStyle}
                                >
                                Start
                            </div>
                            <div style={textStyle}>
                                <div
                                    >
                                    <a onClick={() => this.commander.invokeNamedCommand("new-notebook")}>
                                        New JavaScript notebook
                                    </a>
                                </div>
                                {/* <div>
                                    <a onClick={() => this.commander.invokeNamedCommand("new-typescript-notebook")}>
                                        New TypeScript notebook
                                    </a>
                                </div> */}
                                <div>
                                    <a onClick={() => this.commander.invokeNamedCommand("open-notebook")}>
                                        Open notebook...
                                    </a>
                                </div>
                                <div>
                                    <a onClick={() => this.commander.invokeNamedCommand("open-example-notebook")}>
                                        Open example notebook...
                                    </a>
                                </div>
                            </div>
                        </div>
                    
                        <div 
                            className="flex flex-col p-1 pl-2 m-1 mb-3"
                            style={{
                                border: "1px dashed #C5DAE9",
                                backgroundColor: "#F8F8F8",
                                borderRadius: "3px",
                            }}
                            >
                            <div
                                className="mb-1"
                                style={headingStyle}
                                >
                                Examples
                            </div>

                            <div 
                                style={textStyle}
                                >
                                {exampleNotebooks.map((pair, index) =>
                                    <div
                                        key={index}
                                        >
                                        {this.makeNotebookLink(pair[0], pair[1], false)}
                                    </div>
                                )}
                            </div>
                            <div style={bigTextStyle} className="mt-1">
                                <a onClick={() => this.commander.invokeNamedCommand("toggle-examples-browser")}>
                                    Browse examples
                                </a>
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col w-1/2">
                        <div 
                            className="flex flex-col ml-2 mr-2 mb-3 p-1 pl-2"
                            style={{
                                border: "1px dashed #C5DAE9",
                                backgroundColor: "#F8F8F8",
                                borderRadius: "3px",
                            }}
                            >
                            <div
                                className="mb-1"
                                style={headingStyle}
                                >
                                Help
                            </div>

                            <div 
                                style={textStyle}
                                >
                                <div>
                                    See the getting started <a target="_blank" href="https://wiki.data-forge-notebook.com/getting-started">guide</a> or <a target="_blank" href="https://video.data-forge-notebook.com/getting-started">video</a>.
                                </div>

                                <div>
                                    Open the {this.makeNotebookLink("Intro notebook", path.join(examplesPath, "intro.notebook"), false)}.
                                </div>

                                <div>
                                    <a target="_blank" href="https://wiki.data-forge-notebook.com">Browse the wiki</a>.
                                </div>

                                <div>
                                    <a target="_blank" href="https://javascript.info/">Learn JavaScript</a>.
                                </div>

                                <div>
                                    <a target="_blank" href="https://www.nodebeginner.org/">Learn Node.js</a>.
                                </div>
                            </div>

                            <div style={bigTextStyle} className="mt-1">
                                Explore the <em>Help</em> menu.
                            </div>
                        </div>

                        <div
                            className="flex flex-col flex-grow ml-2 mr-2 mb-3 p-1 pl-2" 
                            style={{
                                border: "1px dashed #C5DAE9",
                                backgroundColor: "#F8F8F8",
                                borderRadius: "3px",
                            }}
                            >
                            <div
                                className="mb-1"
                                style={headingStyle}
                                >
                                Give feedback
                            </div>
                            <div style={textStyle}>
                                <div>
                                    <a target="_blank" href="http://issues.data-forge-notebook.com/new">Report a problem</a>
                                </div>
                                <div className="mt-1">
                                    Drop an email to <a target="_blank" href="mailto:support@data-forge-notebook.com">support@data-forge-notebook.com</a>
                                </div>
                                <div className="mt-1">
                                    Talk to the developer on Slack: send an email to ask for an invite.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
}

