import * as child_process from 'child_process';
const spawn = child_process.spawn;
import { ILog } from 'utils';

let spawnId = 0;

//
// Options for running a command.
//
export interface ICmdOptions {
    //
    // The path of the command to run.
    //
    cmd: string;

    //
    // Arguments to the command.
    //
    args: string[];

    //
    // Working directory for the command.
    //
    cwd?: string;

    //
    // Environment variables to pass to the command.
    //
    env?: any;

    //
    // Enables capture of output.
    //
    captureOutput?: boolean;

    //
    // Enables capture of errors.
    //
    captureErrors?: boolean;

    //
    // User defined function to check the error code and make sure it's ok or not.
    //
    checkErrorCode?: (errorCode: number) => boolean;
}

/*async*/ function spawnWrapper(spawnId: number, cmdOptions: ICmdOptions, log: ILog): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
        log.info("spawn[" + spawnId + "]: " + cmdOptions.cmd + " " +  cmdOptions.args.join(" "));
        if (cmdOptions.cwd) {
            log.info("spawn[" + spawnId + "]: CWD = " +  cmdOptions.cwd);
        }

        /*
        if (cmdOptions.env) { 
            log.info("spawn[" + spawnId + "]: ENV = \r\n" +  JSON.stringify(cmdOptions.env, null, 4));
        }
        */

        let capturedOutput = "";
        let capturedErrMsg = "";

        const process = spawn(cmdOptions.cmd, cmdOptions.args, {
            cwd: cmdOptions.cwd,
            env: cmdOptions.env,
            stdio: ['ignore', 'pipe', 'pipe'],
        });

        process.stdout.on('data', (buf: any) => {
            const output = buf.toString();
            log.info("spawn[" + spawnId + "]: " + output);

            if (cmdOptions.captureOutput) {
                capturedOutput += output;
            }
        });

        process.stderr.on('data', (buf: any) => {
            const partErrMsg = buf.toString();
            log.error("spawn[" + spawnId + "]: " + partErrMsg);

            if (cmdOptions.captureErrors) {
                capturedErrMsg += partErrMsg;
            }
        });
        
        process.on('error', (code: any) => {
            log.error("spawn[" + spawnId + "]: " + code);
            reject(code);
        });

        process.on('exit', (code: number, signal: any) => {
            log.info("spawn[" + spawnId + "]: exited with code " + code);

            const allGood = cmdOptions.checkErrorCode
                ? cmdOptions.checkErrorCode(code)
                : code === 0;

            if (allGood) {
                resolve(cmdOptions.captureOutput ? capturedOutput : undefined);
            }
            else {
                if (cmdOptions.captureErrors && capturedErrMsg) {
                    reject(new Error("spawn[" + spawnId + "]: " + capturedErrMsg + "\r\nError code: " + code));
                }
                else {
                    reject("spawn[" + spawnId + "]: Command " + cmdOptions.cmd + " exited with error code " + code);
                }                
            }
        });
    });
}



export /*async*/ function cmd(cmdOptions: ICmdOptions, log: ILog): Promise<string | undefined> {
    ++spawnId;
    return spawnWrapper(spawnId, cmdOptions, log);
}
