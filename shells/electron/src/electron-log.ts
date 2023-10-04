import { registerSingleton } from "@codecapers/fusion";
import { ElectronMainLog } from "./services/electron-main-log";
import { ILogId } from "utils";

export const log = new ElectronMainLog();
registerSingleton(ILogId, log);
