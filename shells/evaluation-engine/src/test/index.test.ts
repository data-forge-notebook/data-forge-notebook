import * as supertest from "supertest";
import  * as express from "express";
import { api } from "../routes"

//
// Creates a supertest request against the app. 
//
function request() {
    const app = express();
    app.use(api);
    return supertest(app);
}

describe("evaluation engine shell", () => {

    it("can get server status", async ()  => {
        const response = await request().get("/status");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ 
            numEvaluations: 0,
            notebookIds: [],
         });
    });

});
