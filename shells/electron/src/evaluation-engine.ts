import { app } from "electron";
import * as os from "os";
import { ChildProcess, spawn, SpawnOptions }  from "child_process";
import * as path from "path";
import { log } from "./electron-log";

const platform = os.platform();
const isWindows = platform === "win32";
const isMacOS = platform === "darwin";
const isLinux = platform === "linux";

//
// The evaluation engine process.
//
let evaluatorEngineProcess: ChildProcess | undefined = undefined;

//
// Gets the path for data installed with the application.
//
export function getInstallPath(): string {
    if (process.env.INSTALL_PATH) {
        // Override for development and testing.
        return process.env.INSTALL_PATH;
    }

    if (isMacOS) {
        // Go two levels up from the exe on MacOS.
        return path.dirname(path.dirname(app.getPath("exe")));
    }
    else {
        return path.dirname(app.getPath("exe"));
    }
}

//
// Gets the local install path for Node.js.
//
export function getNodejsInstallPath(): string {
    const installPath = getInstallPath();
    const nodeJsPath = `${installPath}/nodejs`;
    return nodeJsPath;
}

//
// Starts the evaluation engine.
//
export function startEvaluationEngine(): void {
    const relEvalEnginePath = `evaluation-engine/`;
    const installPath = getInstallPath();
    console.log(`Install path = ${installPath}`);
    const evalEnginePath = process.env.DEV_EVAL_ENGINE_DIR || path.join(installPath, relEvalEnginePath);
    console.log(`Running eval engine from ${evalEnginePath}`);
    const evalEngineScriptFile = `build/index.js`;
    const evalEngineScriptFilePath = path.join(evalEnginePath, evalEngineScriptFile);
    
    const platform = os.platform();
    const isWindows = platform === "win32";
    const nodeJsPath = getNodejsInstallPath();
    console.log(`Node.js path ${nodeJsPath}`);

    const nodeExePath = path.join(nodeJsPath, isWindows ? "node" : "bin/node");
    const args = [
        "--expose-gc",
        "--max-old-space-size=10000",
        "--inspect",
        evalEngineScriptFilePath,
    ];

    console.log(`Starting evaluation engine with command:`);
    console.log(`${nodeExePath} ${args.join(" ")}`);
    console.log(`Working directory: ${process.cwd()}`);

    const options: SpawnOptions = {
        env: {
            PORT: "9000",
        },
        stdio: ['ignore', 'pipe', 'pipe'],
        cwd: evalEnginePath,
    };

    //
    // Enable these to show the shell for the process.
    //
    // options.shell = true;
    // options.detached = true;

    evaluatorEngineProcess = spawn(nodeExePath, args, options);

    evaluatorEngineProcess.stdout!.on('data', (buf: any) => {
        log.info("** evaluation-engine: " + buf.toString());
    });

    let partialStderrLine = ""; // Collects a partial line recevied from stderr.

    evaluatorEngineProcess.stderr!.on('data', (buf: any) => {
        const message = buf.toString();
        log.error("** evaluation-engine [stderr]: " + message);

        const lines = message.split("\n");
        if (lines.length > 0) {
            if (lines.length === 1) {
                // Keep collecting the line.
                partialStderrLine += lines[0];
            }
            else {
                // Process the first line combined with the partial line.
                const firstLine = lines.shift();
                if (detectFatalErrorMsg(partialStderrLine + firstLine)) {
                    log.error("** Detected fatal error.");
                    log.error(partialStderrLine + firstLine);
                }

                for (let i = 0; i < lines.length - 1; i++) {
                    if (detectFatalErrorMsg(lines[i])) {
                        // Intermediate lines that contain a fatal error.
                        log.error("** Detected fatal error.");
                        log.error(lines[i]);
                    }
                }

                partialStderrLine = lines[lines.length - 1]; // Collection partial line.
            }
        }
    });

    evaluatorEngineProcess.on('error', (...args: any[]) => {
        log.error('** evaluation-engine [error-event]: ' + args.join(', '));
    });

    evaluatorEngineProcess!.on('exit', (code: any, signal: any) => {
        log.warn("** Evaluation engine exited with code " + code + " and signal " + signal + ".");

        if (partialStderrLine.length > 0 && detectFatalErrorMsg(partialStderrLine)) {
            log.error("** Detected fatal error on exit.");
            log.error(partialStderrLine);
        }
    });
}

//
// Kills the evaluation engine process.
//
export function killEvaluationEngine(): void{
    if (evaluatorEngineProcess) {
        evaluatorEngineProcess.kill();
        evaluatorEngineProcess = undefined;
    }
}

//
// If we detect these strings in stderr, report a fatal error.
//
const FATAL_ERROR_STRINGS = [
    "FATAL ERROR: ",
    "- JavaScript heap out of memory",
];

//
// Detect a fatal error message in the specified string.
//
function detectFatalErrorMsg(line: string): boolean {
    for (const fatalErrorString of FATAL_ERROR_STRINGS) {
        if (!line.includes(fatalErrorString)) {
            return false;
        }
    }

    return true;
}
