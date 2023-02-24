# source-maps-lib

All new library for creating and decoding source maps.

The motivation for this is that the defacto standard source-maps library for JavaScript forces inclusion of a wasm files that annoying generally, but really annoying to have to include it in Electron builds.

## Building the code

Open folder in Visual Studio Code and hit Ctrl+Shift+B

Or

```bash
cd typescript-template
npm run build
```

## Debugging

- Open in Visual Studio Code.
- Select 'Main' debug configuration.
- Select the 'Test All' or 'Test Current' debug configuration to debug all tests or the current test file.
- Set your breakpoints.
- Hit F5 to run.

## Build and run

Compile the application:

```bash
npm run build
```

The run the compiled JavaScript:

```bash
npm start
```

## Running without building

Run the command line app directly:

```bash
npm start:dev
```

Run tests directly:

```bash
npm test
```

Or:

```bash
npm run test:watch
```

**Checkout** package.json for more scripts!