import * as React from 'react';
import { CellErrorUI } from './cell-error';
const humanizeDuration = require('humanize-duration');
import moment from 'moment';
import { ICodeCellViewModel } from '../../../../view-model/code-cell';
import { CellOutputUI } from './cell-output';
import styled from 'styled-components';
import { Switch, Position, Tooltip } from '@blueprintjs/core';
import { asyncHandler, debounceAsync, handleAsyncErrors } from '../../../../lib/async-handler';
import { MonacoEditor } from '../../../../components/monaco-editor';
import { CellScope } from '../../../../model/cell';

export interface ICodeCellProps {

    //
    // The language of the code cell.
    //
    language: string;

    //
    // The view-model for the code cell.
    //
    model: ICodeCellViewModel;

    //
    // Callback to update cell height.
    //
    onHeightChanged: () => void;
}

export interface ICodeCellState {
}

const OutputsBorder = styled.div`
    border-top: 1px dashed #F8F8F8;
    transition: border 0.2s ease-in-out;

    :hover {
        border-top: 1px dashed transparent;
        transition: border 0.2s ease-in-out;
    }
`;

const ErrorsBorder = styled.div`
    border-top: 1px dashed red;
    transition: border 0.2s ease-in-out;
`;

export class CodeCellUI extends React.Component<ICodeCellProps, ICodeCellState> {
  
    constructor (props: any) {
        super(props)

        this.state = {};
    }
    
    componentDidMount() {
    }

    componentWillUnmount() {
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
    
    render () {
        const inError = this.props.model.inError();

        let lastEvaluationMsg = "Not evaluated";
        const lastEvaluationDate = this.props.model.getLastEvaluationDate();
        const lastEvaluationDuration = lastEvaluationDate !== undefined ? moment().diff(lastEvaluationDate!) : undefined;
        const humanizedDuration = lastEvaluationDuration !== undefined ? this.humanizeDuration(lastEvaluationDuration!) : undefined;

        if (inError) {
            lastEvaluationMsg = "Errored";

            if (humanizedDuration) {
                    lastEvaluationMsg += " " + humanizedDuration;
            }
        }
        else if (humanizedDuration) {
            lastEvaluationMsg = "Evaluated " + humanizedDuration;
        }

        const errors = this.props.model.getErrors();
        const outputs = this.props.model.getOutput();

        return (
            <div>
                <div>
                    <div
                        style={{
                            fontFamily: "'Source Code Pro', monospace",
                            paddingTop: "16px",
                            paddingRight: "8px",
                            paddingBottom: "16px", 
                        }}
                        >
                        <MonacoEditor
                            minHeight={40}
                            language={this.props.language}
                            model={this.props.model} 
                            onHeightChanged={() => this.props.onHeightChanged()}
                            />
                    </div>
                    <div 
                        style={{
                            padding: "4px",
                        }}
                        >             
                        {errors.length > 0
                            && <ErrorsBorder>
                                {errors.map((error, index) => 
                                    <CellErrorUI 
                                        msg={error.getMsg()} 
                                        key={error.getInstanceId()} 
                                        />
                                )}
                            </ErrorsBorder>
                        }

                        {outputs.length > 0
                            && <OutputsBorder>
                                {outputs.map(output => 
                                    <CellOutputUI 
                                        model={output} 
                                        key={output.getInstanceId()} 
                                        onHeightChanged={() => this.props.onHeightChanged()}
                                        />
                                )}
                            </OutputsBorder>
                        }
                    </div>
                </div>

                <div 
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
                        {/* <Tooltip
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
                        </Tooltip> */}
                    </div>
                </div>

            </div>
        );
    }
}

