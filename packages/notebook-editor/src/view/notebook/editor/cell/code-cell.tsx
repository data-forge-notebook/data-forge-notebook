import * as React from 'react';
import { CellErrorUI } from './cell-error';
const humanizeDuration = require('humanize-duration');
import moment from 'moment';
import { ICodeCellViewModel } from '../../../../view-model/code-cell';
import { CellOutputUI } from './cell-output';
import { MonacoEditor } from '../../../../components/monaco-editor';
import { INotebookViewModel } from '../../../../view-model/notebook';
import { observer } from 'mobx-react';

export interface ICodeCellProps {

    //
    // The language of the code cell.
    //
    language: string;

    //
    // The view-model for the code cell.
    //
    cell: ICodeCellViewModel;

    //
    // The view-model for the notebook.
    //
    notebook: INotebookViewModel;
}

export interface ICodeCellState {
}

class CodeCellUIView extends React.Component<ICodeCellProps, ICodeCellState> {
  
    constructor (props: any) {
        super(props)

        this.state = {};
    }

    //
    // Humanize the time duration.
    //
    humanizeDuration(durationMS: number): string {
        if (durationMS < 1000) {
            return "a moment ago";
        }

        const humanizeOptions = {
            units: ['y', 'mo', 'w', 'd', 'h', 'm', 's', ],
            round: true,
            largest: 1,
        };
                
        return humanizeDuration(durationMS, humanizeOptions) + " ago";
    }
    
    private onEscapeKey = async () => {
        await this.props.notebook.deselect();
    }

    render () {
        const cellExecuting = this.props.cell.executing;
        const inError = !cellExecuting && this.props.cell.errors?.length > 0;

        let lastEvaluationMsg = "Not evaluated";
        const lastEvaluationDate = this.props.cell.lastEvaluationDate;
        const lastEvaluationDuration = lastEvaluationDate !== undefined ? moment().diff(lastEvaluationDate!) : undefined;
        const humanizedDuration = lastEvaluationDuration !== undefined ? this.humanizeDuration(lastEvaluationDuration!) : undefined;

        if (cellExecuting) {
            lastEvaluationMsg = "Evaluating...";
        }
        else if (inError) {
            lastEvaluationMsg = "Errored";

            if (humanizedDuration) {
                    lastEvaluationMsg += " " + humanizedDuration;
            }
        }
        else if (humanizedDuration) {
            lastEvaluationMsg = "Evaluated " + humanizedDuration;
        }

        const errors = this.props.cell.errors;
        const outputs = this.props.cell.output;

        return (
            <div>
                <div>
                    <div
                        style={{
                            fontFamily: "'Source Code Pro', monospace",
                            paddingTop: "11px",
                            paddingBottom: "0px", 
                        }}
                        >
                        <MonacoEditor
                            language={this.props.language}
                            cell={this.props.cell} 
                            working={cellExecuting}
                            onEscapeKey={this.onEscapeKey}
                            />
                    </div>
                   <div>             
                        {errors.length > 0
                            && <div className="errors-border">
                                {errors.map((error, index) => 
                                    <CellErrorUI 
                                        key={error.instanceId}
                                        error={error} 
                                        />
                                )}
                            </div>
                        }

                        {outputs.length > 0
                            && <div className="outputs-border">
                                {outputs.map(output => 
                                    <CellOutputUI 
                                        key={output.instanceId}
                                        output={output} 
                                        notebook={this.props.notebook}   
                                        />
                                )}
                            </div>
                        }
                    </div>
                </div>

                {/* <div 
                    className="cell-msg"
                    style={{ 
                        position: "absolute", 
                        top: 8, 
                        right: 10,
                    }}
                    >
                    <div className="flex flex-row items-center bg-gray-100 p-1 rounded  border border-solid border-gray-200">
                        <div
                            style={{ 
                                fontSize: "0.8em",
                                color: inError ? "red" : "black",
                            }}
                            >
                            {lastEvaluationMsg}
                        </div>
                        <Tooltip
                            content={`Switches on "local" mode, when enabled the cell is wrapped in a function and made independent of other code cells (like the JavaScript "module pattern"). \n\nVariables defined in the cell are private to the cell.`}
                            position={Position.LEFT}
                            usePortal={false}
                            >
                            <Switch 
                                className="ml-2" 
                                style={{
                                    marginBottom: "0px",
                                }}
                                innerLabel="Global"
                                innerLabelChecked="Local"
                                checked={this.props.model.getCellScope() === CellScope.Local}
                                onChange={event => 
                                    handleAsyncErrors(async () => { 
                                        await this.props.model.setCellScope(event.currentTarget.checked ? CellScope.Local : CellScope.Global)
                                        this.forceUpdate();
                                    })
                                }
                                >
                            </Switch>
                        </Tooltip>
                    </div>
                </div>
                */}

            </div>
        );
    }
}

export const CodeCellUI = observer(CodeCellUIView);