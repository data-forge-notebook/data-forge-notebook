//
// Service for interacting with the file system.
//

import { InjectableSingleton } from "@codecapers/fusion";
import * as fs from "fs-extra";

export const IFileId = "IFile";

export interface IFile   {

    //
    // Creates the requested directory if it doesn't already exist.
    //
    ensureDir(dirPath: string): Promise<void>;

    //
    // Determines if the specified file exists.
    //
    exists(filePath: string): Promise<boolean>;

    //
    // Reads a text file.
    //
    readFile(filePath: string): Promise<string>;

    // 
    // Writes a text file.
    //
    writeFile(filePath: string, fileData: string): Promise<void>;

    //
    // Reads a JSON file.
    //
    readJsonFile<ResultT = any>(filePath: string): Promise<ResultT>;

    //
    // Writes a JSON file.
    //
    writeJsonFile(filePath: string, data: any): Promise<void>;

    //
    // Determines if a specific file is read-only.
    //
    isReadOnly(filePath: string): Promise<boolean>;
}


@InjectableSingleton(IFileId)
export class File implements IFile {

    //
    // Creates the requested directory if it doesn't already exist.
    //
    async ensureDir(dirPath: string): Promise<void> {
        await fs.ensureDir(dirPath);
    }

    //
    // Determines if the specified file exists.
    //
    exists(filePath: string): Promise<boolean> {
        return new Promise<boolean>(resolve => {
            fs.access(filePath, fs.constants.F_OK, err => {
                if (err) {
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
    
            // Old code - not as good performance.
            //
            // fs.exists(filePath, exists => {
            //     resolve(exists);
            // });
        });
    }

    //
    // Reads a text file.
    //
    readFile(filePath: string): Promise<string> {
        return new Promise((resolve, reject) => {
            fs.readFile(filePath, "utf8", (err, data) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(data);
                }
            });
        })
    }

    // 
    // Writes a text file.
    //
    async writeFile(filePath: string, fileData: string): Promise<void> {
        return new Promise((resolve, reject) => {
            fs.writeFile(filePath, fileData, err => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve();
                }
            });
        })
    }

    //
    // Reads a JSON file.
    //
    async readJsonFile<ResultT = any>(filePath: string): Promise<ResultT> {
        const jsonData = await this.readFile(filePath);
        return JSON.parse(jsonData);
    }
    
    //
    // Writes a JSON file.
    //
    async writeJsonFile(filePath: string, data: any): Promise<void> {
        const jsonData = JSON.stringify(data, null, 4);
        await this.writeFile(filePath, jsonData);
    }

    //
    // Determines if a specific file is read-only.
    //
    async isReadOnly(filePath: string): Promise<boolean> {
        return new Promise((resolve) => {
            fs.access(filePath, fs.constants.W_OK, (err) => {
                if (err) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
        });
    }
}