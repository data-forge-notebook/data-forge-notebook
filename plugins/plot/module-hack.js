//
// This is a hack used by the build process to remove type="module" from index.html after bundling by Parcel.
// This is needed because Parcel requires type="module" to work and the inliner fails to inline the package when type="module" is present!
//

const fs = require("fs/promises");

const filePath = "dist/index.html";

async function main() {
    const fileContent = await fs.readFile(filePath, "utf-8");
    const outputFileContent = fileContent.replace(/type="module"/, "");
    await fs.writeFile(filePath, outputFileContent);
}

main()
    .catch(err => {
        console.error(`Failed to replace text in ${filePath}.`);
        console.error(err);
        process.exit(1);
    });