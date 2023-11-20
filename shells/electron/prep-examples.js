//
// Prepares example notebook data for bundling.
//

const fs = require('fs-extra');

const exampleNotebooksPath = "../../notebooks/examples";

const notebookFiles = fs.readdirSync(exampleNotebooksPath);
    const exampleNotebookData = [];

    for (const notebookFile of notebookFiles) {
        if (!notebookFile.endsWith(".notebook")) {
            // Note a notebook.
            continue;
        }
        
        //
        // Load the notebook as json.
        //
        const notebookPath = `${exampleNotebooksPath}/${notebookFile}`;
        const notebook = JSON.parse(fs.readFileSync(notebookPath, 'utf8'));
        exampleNotebookData.push({
            file: notebookFile,
            description: notebook.description,           
        });        
    }

    const outputFilePath = `./src/data/example-notebooks.ts`;
    fs.writeFileSync(outputFilePath, `export const exampleNotebooks = ` + JSON.stringify(exampleNotebookData, null, 2) + `;`);

    console.log(`Wrote ${outputFilePath}`);
