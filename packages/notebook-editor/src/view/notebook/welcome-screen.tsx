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

    constructor (props: IWelcomeScreenProps) {
        super(props);

        this.state = {
            showGettingStarted: true,
        };

        this.componentDidMount = asyncHandler(this, this.componentDidMount);
    }

    async componentDidMount() {

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
        const exampleNotebooks: [string, string][] = [
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
                                You can also watch the 
                                <a  
                                    className="ml-1 mr-1"
                                    target="_blank"
                                    href="https://video.data-forge-notebook.com/getting-started"
                                    >
                                    Getting Started Video
                                </a>
                                online. Or read the
                                <a  
                                    className="ml-1"
                                    target="_blank"
                                    href="https://wiki.data-forge-notebook.com/getting-started"
                                    >
                                    Getting Started Guide
                                </a>
                                .
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
                                Recent
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
                            <div style={bigTextStyle} className="mt-1">
                                <a 
                                    onClick={() => {
                                        this.commander.invokeNamedCommand("clear-recent-files");
                                        this.forceUpdate();
                                    }}
                                    >
                                    Clear recent files
                                </a>
                            </div>
                            <div style={bigTextStyle} className="mt-1">
                                See <em>File</em> menu for full list
                            </div>
                        </div>
                    </div>
                }

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
                            <a onClick={() => this.commander.invokeNamedCommand("new-javascript-notebook")}>
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
                    </div>
                </div>
            
                {/* <div 
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
                            See all examples
                        </a>
                    </div>
                </div> */}

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
                            {/*todo: Open the {this.makeNotebookLink("Intro notebook", path.join(introPath, "intro.notebook"), false)}. */}
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

                {/* <div 
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
                        Share
                    </div>
                    <div style={textStyle}>
                        Tell your friends and colleagues about <a target="_blank" href={this.makeLandingPageLink()}>Data-Forge Notebook</a>:
                        <ul>
                            <li><a target="_blank" href="https://twitter.com/intent/tweet?text=Data-Forge%20Notebook%20is%20freaking%20awesome!%20https://www.data-forge-notebook.com%20@ashleydavis75%20%23data-forge-notebook">Share on Twitter</a></li>
                            <li><a target="_blank" href="https://www.facebook.com/sharer/sharer.php?u=https%3A//www.data-forge-notebook.com">Share on Facebook</a></li>
                        </ul>
                    </div>
                </div> */}

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
        );
    }
}
