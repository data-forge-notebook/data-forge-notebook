import * as React from "react";
import * as ReactDOM from "react-dom";
import { Button } from "@blueprintjs/core";
import { MonacoEditor } from "notebook-editor/build/components/monaco-editor";
import { PluggableVisualization } from "notebook-editor/build/view/notebook/editor/cell/pluggable-visualization";
import { CodeCellViewModel } from "notebook-editor/build/view-model/code-cell";
import { CellType } from "model";

import "notebook-editor/build/services/impl/date-provider";

function App() {
    return (
        <div>
            <h1>Data-Forge Notebook testbed</h1>
            <div>
                <Button icon="refresh" />
                <MonacoEditor
                    cell={
                        new CodeCellViewModel(
                            "1234",
                            CellType.Code,
                            "const x = 1;",
                            undefined,                            
                            [], []
                        )
                    }
                    language="javascript"
                    />       
                <hr />
                <h1>Pluggable visualization test run:</h1>     
                <PluggableVisualization
                    pluginRequest={{
                        data: {
                            some: "data",
                            array: [1, 2, 3],
                        },
                    }}
                    pluginOptions={{
                    }}
                    />
            </div>
        </div>
    );
}

ReactDOM.render(<App />, document.getElementById("root"));
