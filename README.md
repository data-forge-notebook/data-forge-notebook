# editor-core

The core repository for Data-Forge Notebook's editor. Reused in the Electron and Online builds.

Data-Forge Notebook is being open sourced in this code repository in 2022.

[Read more about the decision here](https://github.com/data-forge-notebook/wiki/wiki/Future-Plans)

[See the issues page to contribute to the discussion](https://github.com/data-forge-notebook/editor-core/issues)

[Follow the developer on Twitter for more frequent news and updates](https://twitter.com/codecapers)

## Setup 

Clone this repo locally, open a terminal and change to the local directory.

Install dependencies:

```bash
npm install
```

## Run the browser shell

This runs the whole notebook editor in the browser.

```bash
npm start
```

## Run the Electron shell

This runs the whole notebook editor in Electron (with a static build):

```bash
npm run electron
```

To run in Electron with live reload:

```bash
npm run electron:live
```

## Run the testbed

The testbed is used for testing selected UI components.

```bash
npm run testbed
```

## Run Storybook

Storybox showcases various configurations for UI components.

```bash
npm run storybook
```

## Build the TypeScript code

```bash
npm run build
```

Compiled JavaScript code is output to `ts-build`.

## Run automated test

```bash
npm tests
```

## Test a local plugin

Clone a plugin repo, for example
[the structured data plugin](https://github.com/data-forge-notebook/output-plugin-structured-data).

Install dependencies (`npm install`) and then run the web server for the local plugin (usually `npm start` or `npm run start:dev`).

Open `editor-core/src/testbed/services/plugin-repository.ts` and set `pluginUrl` to the local URL for the plugin web server (e.g.  http://127.0.0.1:5000).