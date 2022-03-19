import * as React from "react";
import { MonacoEditor } from "./components/monaco-editor";
import { PluggableVisualization } from "./notebook/cell/output/pluggable-visualization";
import { Button } from "@blueprintjs/core";

export function NotebookEditor() {
    return (
        <div>
            <Button icon="refresh" />
            <MonacoEditor 
                text={"async function hello() {\n}\n\nawait hello();\n\nconst x = 5;\n\nconst x = 3;"}
                language="javascript"
                onChange={async (updatedText) => {
                    console.log("Code changed:");
                    console.log(updatedText);
                }}            
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
    );
}
