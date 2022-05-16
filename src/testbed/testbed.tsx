import * as React from "react";
import * as ReactDOM from "react-dom";
import "./services/plugin-repository";
import { Button } from "@blueprintjs/core";
import { MonacoEditor } from "../components/monaco-editor";
import { PluggableVisualization } from "../notebook/cell/output/pluggable-visualization";
import { CodeCellViewModel } from "../view-model/code-cell";
import { Cell, CellScope, CellType } from "../model/cell";

function App() {
    return (
        <div>
            <h1>Data-Forge Notebook testbed</h1>
            <div>
                <Button icon="refresh" />
                <MonacoEditor
                    model={
                        new CodeCellViewModel(
                            new Cell(
                                "1234",
                                CellType.Code,
                                CellScope.Global,
                                "const x = 1;",
                                undefined,
                                undefined,
                                [], []
                            ),
                            [], []
                        )
                    }
                    language="javascript"
                    />       
                <hr />
                <h1>Pluggable visualization test run:</h1>     
                <PluggableVisualization
                    config={{
                        data: {
                            some: "data",
                            array: [1, 2, 3],
                        },
                    }}
                    />
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById("root"));
