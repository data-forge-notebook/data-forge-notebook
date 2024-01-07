# data-forge-notebook

Data-Forge Notebook is a cross-platform notebook application for JavaScript and TypeScript.

The is the mono repo for Data-Forge Notebook.

**DFN v2 has been released**. [Jump into the releases page and download the build for your platform](https://github.com/data-forge-notebook/data-forge-notebook/releases)

[Read the wiki](https://github.com/data-forge-notebook/data-forge-notebook/wiki)

[See the issues page and contribute](https://github.com/data-forge-notebook/data-forge-notebook/issues)

[Follow the developer on Twitter for more news and updates](https://twitter.com/codecapers)

## Project structure

A birds eye view of this project:

```
└───data-forge-notebook ------ The DFN v2 monorepo.
    ├───packages --------------- Packages shared within the monorepo.
    │   ├───host-bridge ------------ Communication between DFN and plugins.
    │   ├───evaluation-engine ------ Implements the code evaluation engine.
    │   ├───model ------------------ The data model for a notebook.
    │   ├───notebook-editor -------- Implements the notebook editor.
    │   └───plugins ---------------- Contains compiled plugins.
    ├───plugins ---------------- Visualization plugins.
    │   ├───apex ------------------- Uses Apex to plot charts.
    │   ├───data ------------------- Visualizes structured data.
    │   ├───geo -------------------- Uses Leaflet to plot maps.
    │   ├───html ------------------- Renders HTML markup.
    │   ├───table ------------------ Renders data in a table.
    │   └───text ------------------- Displays text data.
    ├───scripts ---------------- Scripts for building and serving plugins.
    └───shells ----------------- Various implementations of DFN.
        ├───browser ---------------- Runs DFN in the browser.
        ├───electron --------------- Runs DFN in Electron.
        ├───evaluation-engine ------ HTTP server for the code evaluation engine.
        ├───testbed ---------------- A browser-based testbed for UI components.
        └───testbed-cli ------------ A cli-based testbed.
```
## Quickstart - Electron

```bash
cd data-forge-notebook
pnpm install
pnpm run compile
pnpm run electron:dev
```

## Quickstart - Browser

```bash
cd data-forge-notebook
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
cd data-forge-notebook
pnpm install
```

## Compile all packages

Before you should do anything you should compile all TypeScript code to JavaScript. You only have to do this once at the start and you only need to recompile packages when you change code in them.

```bash
pnpm run compile
```

Compiled JavaScript code is output to the `build` subdirectory for each project.

You can also compile all packages in watch mode which can be useful if you are changing code and want them to recompile automatically:

```bash
pnpm run compile:watch
```

## Build plugins

For static (precompiled, no live reload) builds, you must also build the web pages for all plugins:

```bash
pnpm run build-plugins
```
## Run the browser shell

This runs the whole notebook editor in the browser.

```bash
pnpm start
```

The plugins (which are complete web pages in their own right) and also served in "dev" mode from the `./plugins` directory. You can edit the code for the plugins, but you might have to manually refresh the browser to see updated plugins.

## Build a static web page

This builds the notebook editor to a static web page:

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

To run in Electron in dev mode:

```bash
pnpm run electron:dev
```

## Build the Electron installer

First set the parent temporary directory required for building. 

On Windows:

```bash
set BUILD_PARENT_DIR=c:\temp
```

On MacOS / Linux:

```bash
export BUILD_PARENT_DIR=/tmp
```

Run one of the scripts depending on the OS you are on building for:

```bash
pnpm run build-electron-win
pnpm run build-electron-linux
pnpm run build-electron-mac
```

For complete build details see [./shells/electron/README.md](./shells/electron/README.md).

## Run the testbed

The testbed is used for testing selected UI components.

```bash
pnpm run testbed
```

## Run automated tests

```bash
pnpm test
```