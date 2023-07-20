# evaluation-engine

The evaluation engine HTTP server, evaluates code for Data-Forge Notebook.

## Building the code


```bash
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

Then run the compiled JavaScript:

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

Or with live reload:

```bash
npm run test:watch
```

## Build the evaluation engine for inclusion in the DFN installer

NOTE: This doesn't work under Windows terminal due to some problem with pnpm. This step should be done under Powershell.

From the root of the mono repo:

```bash
pnpm run package-eval-engine
```