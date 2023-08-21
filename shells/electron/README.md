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