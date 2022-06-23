import { InjectableSingleton } from "@codecapers/fusion";
import * as uuid from 'uuid';

export const IIdGeneratorId = "IIdGenerator";

export interface IIdGenerator {

    //
    // Generates a unique ID.
    //
    genId(): string;
}

//
// A service that generates unique ids.
//
@InjectableSingleton(IIdGeneratorId)
export class IdGenerator implements IIdGenerator {

    //
    // Generates a unique ID.
    //
    genId (): string {
        return uuid.v1();
    }    
}