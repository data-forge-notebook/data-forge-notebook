import * as React from "react";
import { MonacoEditor } from "./components/monaco-editor";
import { PluggableVisualization } from "./notebook/cell/output/pluggable-visualization";
import { Button } from "@blueprintjs/core";

export default function NotebookEditor() {
    return (
        <div>
            <Button icon="refresh" />
            <MonacoEditor />       
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
    );
}
