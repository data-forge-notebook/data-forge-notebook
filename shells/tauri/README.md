# Tauri

The Tauri-based shell for DFN v2.

Follow instructions in the root directory for setup.

## Start it for dev (with live reload)

```bash
pnpm start
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

## Build the Tauri bundle

Release:

```bash
pnpm run build
```

Or debug:

```bash
pnpm run build-debug
```