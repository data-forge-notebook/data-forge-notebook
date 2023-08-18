# editor-core

The core repository for Data-Forge Notebook's editor. Reused in the Tauri and Electron.

Data-Forge Notebook is being open sourced in this code repository in 2022/23.

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
        ├───tauri ------------------ Runs DFN in Tauri.
        └───testbed ---------------- A custom testbed for UI components.
```

## Quickstart - Tauri

Note: You need Rust installed for the Tauri build.

```bash
cd editor-core
pnpm install
pnpm run compile
pnpm run tauri:dev
```

## Quickstart - Electron

```bash
cd editor-core
pnpm install
pnpm run compile
pnpm run electron:dev
```

## Quickstart - Browser

```bash
cd editor-core
pnpm install
pnpm run compile
pnpm run start
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

## Compile all packages

Before you should do anything you should compile all TypeScript code to JavaScript. You only have to do this once at the start and you only need to recompile packages when you change code in them.

```bash
pnpm run compile
```

You can also compile all packages in watch mode which can be useful if you are changing code and want them to recompile automatically:

```bash
pnpm run compile:watch
```

## Build plugins

For static builds, you must also build the web pages for all plugins:

```bash
pnpm run build-plugins
```
## Run the browser shell

This runs the whole notebook editor in the browser.

```bash
pnpm start
```

It is runs in "dev" mode with live reload enabled.

The plugins (which are complete web pages in their own right) and also served in "dev" mode from the `./plugins` directory. You can edit the code for the plugins, but you might have to manually refresh the browser to

## Build a static web page

This builds the notebook editor to a static web page:

```bash
pnpm run build-browser
```

The static web page is generated to `./shells/browser/dist/browser`.

The plugins are automatically built and inlined into the package.

## Run the Tauri shell

Note: You need Rust installed for the Tauri build.

This runs the whole notebook editor in Tauri (with a static build):

```bash
pnpm run tauri:static
```

To run in Tauri with live reload:

```bash
pnpm run tauri:dev

## Run the Electron shell

This runs the whole notebook editor in Electron (with a static build):

```bash
pnpm run electron:static
```

To run in Electron with live reload:

```bash
pnpm run electron:dev
```

## Build the Tauri installer

WARNING: The Tauri build doesn't work. It seems to crash while buliding the project.

NOTE: You need Rust installed for the Tauri build.

NOTE: The evaluation engine needs to be packaged before making the Tauri build. This part of the process doesn't work under Windows terminal due to an issue with pnpm, run this under Powershell instead.

Package the evaluation engine:

```bash
pnpm run package-eval-engine
```

Then build the release Tauri installer:

```bash
pnpm run build-tauri
```

Or debug:

```bash
pnpm run build-tauri-debug
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

Compiled JavaScript code is output to the `build` subdirectory for each project.

## Run automated tests

```bash
pnpm test
```