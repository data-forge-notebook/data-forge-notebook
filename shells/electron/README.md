# Electron

The Electron-based shell for DFN v2.

First, follow instructions in the root directory for setup.

## Start it

```bash
pnpm start
```

## Start it with live reload

```bash
pnpm run start:dev
```

## Compile TypeScript code

```bash
pnpm run compile
```

## Build the static web page

```bash
pnpm run pack
```

Static web page is output to `./dist`.

## Build the installer

The installer requires a separate directory temporary outside the monorepo due to issues with pnpm. During the build process the project is exported to the temporary directory.

You need to set the parent of the temporary directory as an environment variable. Set it to any temporary location on your drive, you can delete the whole directory after the build:

```bash
export BUILD_PARENT_DIR=<a-tmp-dir>
```

Or on Windows:

```bash
set BUILD_PARENT_DIR=<a-tmp-dir>
```

Then run the build depending on which OS you are building on and for:

```bash
npm run build-win
npm run build-linux
npm run build-mac
```

After the build you can find the exported project under <a-tmp-dir> and under the subdirectory `dfn-build`. Under there drill down to the `installer` subdirectory and you'll find the installer that was built for DFN.

After you copy the installer out feel free to delete the temporary directory.

On Windows, if you see an error like the following you might have to close VS Code: 

```bash
EPERM: operation not permitted, open 'C:\temp\dfn-build\tmp-eval-engine\node_modules\.bin\upgrade-blueprint-2.0.0-rename'
```

## Important directories

### Windows

- Settings directory: C:\Users\ash\AppData\Roaming\data-forge-notebook-v2
- Install directory: C:\Users\ash\AppData\Local\Programs\data-forge-notebook-v2
- Log file: C:\Users\ash\AppData\Roaming\data-forge-notebook-v2\log.log

### Linux

- Settings: $XDG_CONFIG_HOME/data-forge-notebook-v2 or ~/.config/data-forge-notebook-v2
- Log file: ~/.config/data-forge-notebook-v2/log.log


### MacOS 

- Home path: /Users/<username>
- Install directory: /Applications/data-forge-notebook-v2.app/Contents
- Exe path: /Applications/data-forge-notebook-v2.app/Contents/MacOS/data-forge-notebook-v2
- Nodejs path: /Applications/data-forge-notebook-v2.app/Contents/nodejs
- Evalution engine path: /Applications/data-forge-notebook-v2.app/Contents/evaluation-engine
- Settings: ~/Library/Application\ Support/data-forge-notebook-v2
- Log file: ~/Library/Logs/data-forge-notebook-v2/log.log
- App data: ~/Library/Application Support
- User data: ~/Library/Application\ Support/data-forge-notebook-v2
- Temp path: /var/folders/by/<guid>/T/
- Documents path: ~/Documents
- Downloads path: ~/Downloads

## Run a local build from the dev evaluation engine

Set the environment variable to the path for the evaluation engine project:

```bash
set DEV_EVAL_ENGINE_DIR=c:\projects\data-forge-notebook\editor-core\shells\evaluation-engine
```

Run it this way:

``` bash
pnpm run electron:static
```

Or this way:

```bash
pnpm run electron:dev
```

Note: Make sure you compile the evaluation engine first. Run `pnpm run compile` at the root of the mono-repo to compile everything.

## Run a local build from the installed app data path

Set the environment variable to the installed path:

On Windows:

```bash
set APP_DATA_PATH=C:\Users\Ash\AppData\Local\Programs\data-forge-notebook-v2
```

On MacOS:

```bash
export APP_DATA_PATH=/Applications/data-forge-notebook-v2.app/Contents
```

Run it this way:

``` bash
pnpm run electron:static
```

Or this way:

```bash
pnpm run electron:dev
```


## Setting the URL for the evaluation engine

Normally the electron build automatically spawns the evaluation engine. But you can also run it separately and instruct the electron build to connect to it using this environment variable:

```bash
set EVALUATION_ENGINE_URL=http://localhost:7000
```

When running the evaluation engine you must set the port to match:

```bash
set PORT=7000
```

