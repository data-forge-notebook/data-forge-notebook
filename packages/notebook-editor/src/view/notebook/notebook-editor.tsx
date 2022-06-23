import { InjectableClass } from "@codecapers/fusion";
import * as React from "react";
import { asyncHandler } from "../../lib/async-handler";
import { forceUpdate } from "../../lib/force-update";
import { IAppViewModel } from "../../view-model/notebook-editor";
import { NotebookUI } from "./notebook";

export interface IEditorProps {
    model: IAppViewModel;
}

export interface IEditorState {
}

@InjectableClass()
export class EditorUI extends React.Component<IEditorProps, IEditorState> {

    constructor (props: any) {
        super(props);

        this.state = {
            isRecentNotebooksPickerOpen: false,
            isExampleBrowserOpen: false,
            isCommandPaletteOpen: false,
            isSettingsOpen: false,
        };

        this.componentDidMount = asyncHandler(this, this.componentDidMount);
        this.onOpenNotebookChanged = asyncHandler(this, this.onOpenNotebookChanged);
    }

    private async onOpenNotebookChanged(isReload: boolean): Promise<void> {
        await forceUpdate(this);

        if (!isReload) {
            document.documentElement.scrollTop = 0;
        }
    }

    async componentDidMount() {
        this.props.model.onOpenNotebookChanged.attach(this.onOpenNotebookChanged);
    }

    componentWillUnmount(): void {
        this.props.model.onOpenNotebookChanged.detach(this.onOpenNotebookChanged);
    }

    render () {
        return (
            <div 
                className="border" 
                >
                <div>
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
                            : <div>Notebook not loaded {/*todo have a button here to load the notebook? or not?*/} </div>
                        }
                        
                    </div>
                </div>
            </div>
        );
    }
}