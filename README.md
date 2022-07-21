# editor-core

The core repository for Data-Forge Notebook's editor. Reused in the Electron and Online builds.

Data-Forge Notebook is being open sourced in this code repository in 2022.

[Read more about the decision here](https://github.com/data-forge-notebook/wiki/wiki/Future-Plans)

[See the issues page to contribute to the discussion](https://github.com/data-forge-notebook/editor-core/issues)

[Follow the developer on Twitter for more frequent news and updates](https://twitter.com/codecapers)

[Data-Forge Notebook v1 available here](https://www.data-forge-notebook.com/)

## Project structure

A birds eye view of this project:

```
└───editor-core ------------ The DFN v2 monorepo.
    ├───packages --------------- Packages shared within the monorepo.
    │   ├───host-bridge ------------ Communication between the DFN and plugins.
    │   ├───evaluation-engine ------ Implements the code evaluation engine.
    │   ├───model ------------------ The data model for a notebook.
    │   ├───notebook-editor -------- Implements the notebook editor.
    │   └───plugins ---------------- Contains compiled plugins.
    ├───plugins ---------------- Visualization plugins.
    │   ├───data ------------------- Visualizes structured data.
    │   ├───plot ------------------- Plots charts.
    │   ├───table ------------------ Renders data in a table.
    │   └───text ------------------- Displays text data.
    ├───scripts ---------------- Scripts for building and serving plugins.
    └───shells ----------------- Various implementations of DFN.
        ├───browser ---------------- Runs DFN in the browser.
        ├───electron --------------- Runs DFN in Electron.
        ├───evaluation-engine ------ HTTP server for the code evaluation engine.
        ├───storybook -------------- Showcases UI components in Storybook.
        └───testbed ---------------- A custom testbed for UI components.
```

## Setup 

Clone this repo locally, open a terminal and change to the local directory.

This projects used `pnpm` instead of `npm` because it's so much faster.

Install pnpm:

```bash
npm install -g pnpm
```

Install dependencies for this project:

```bash
pnpm install
```

## Run the browser shell

This runs the whole notebook editor in the browser.

```bash
pnpm start
```

It is runs in "dev" mode with live reload enabled.

The plugins (which are complete web pages in their own right) and also served in "dev" mode from the `./plugins` directory. You can edit the code for the plugins, but you might have to manually refresh the browser to see the changes.

## Build a static web page

This builds the browser shell to a static web page:

```bash
pnpm run build-browser
```

The static web page is generated to `./shells/browser/dist/browser`.

The plugins are automatically built and inlined into the package.

## Run the Electron shell

This runs the whole notebook editor in Electron (with a static build):

```bash
pnpm run electron:static
```

To run in Electron with live reload:

```bash
pnpm run electron:dev
```

## Run the testbed

The testbed is used for testing selected UI components.

```bash
pnpm run testbed
```

## Run Storybook

Storybox showcases various configurations for UI components.

```bash
pnpm run storybook
```

## Build the TypeScript code

```bash
pnpm run compile
```

Compiled JavaScript code is output to the `build` subdirectory for each project.

## Run automated tests

```bash
pnpm test
```