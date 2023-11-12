import * as supertest from "supertest";
import  * as express from "express";
import { api } from "../routes"
import { sleep } from "utils";

//
// Creates a supertest request against the app. 
//
function request() {
    const app = express();
    app.use(express.json());
    app.use(api);
    return supertest(app);
}

describe("evaluation engine shell", () => {

    jest.setTimeout(30000);

    it("can get server status", async ()  => {
        const response = await request().get("/status");
        expect(response.status).toBe(200);
        expect(response.body).toEqual({ 
            notebooks: [],
         });
    });

    it("can install notebook", async ()  => {

        const notebookId = "8471e81a-844b-49df-939d-9ee4672e0bc1";

        const installResponse = await request()
            .post("/install")
            .send({
                "notebookId": notebookId,
                "notebook": {
                    "version": 3,
                    "language": "javascript",
                    "cells": [
                        {
                            "id": "f0627130-2e9c-11e9-9f0a-97b474081a71",
                            "cellType": "code",
                            "code": "console.log(\"fooey\");"
                        }
                    ]
                }
            });

        expect(installResponse.status).toBe(200);

        let messages: any[] = [];
        
        while (true) {
            await sleep(100);

            //
            // Check evaluation status.
            //
            const statusResponse = await request().get("/status");

            //
            // Collect messages produced by the evaluation.
            //
            const messagesResponse = await request()
                .post("/messages")
                .send({ notebookId: notebookId });
            messages = messages.concat(messagesResponse.body.messages);

            expect(statusResponse.body.notebooks.length).toBe(1);

            if (!statusResponse.body.notebooks[0].working 
                && statusResponse.body.notebooks[0].success) {
                // Evaluation has completed.
                break;
            }
        }

        const stopResponse = await request()
            .post("/stop-evaluation")
            .send({ notebookId });
        expect(stopResponse.status).toBe(200);

        await sleep(100); // Give the worker a chance to stop.

        //
        // Remove debug messages.
        //
        messages = messages.filter(message => message.name !== "evaluation-event" || message.args.event !== "debug-log");

        expect(messages).toEqual([
            {
                "name": "evaluation-event",
                "args": {
                    "event": "notebook-install-started"
                },
                "notebookId": "8471e81a-844b-49df-939d-9ee4672e0bc1"
            },
            {
                "name": "evaluation-event",
                "args": {
                    "event": "notebook-install-completed"
                },
                "notebookId": "8471e81a-844b-49df-939d-9ee4672e0bc1"
            },
        ]);
    });

    it("can evaluate notebook", async ()  => {

        const notebookId = "8471e81a-844b-49df-939d-9ee4672e0bc1";

        const evaluateResponse = await request()
            .post("/evaluate")
            .send({
                "notebookId": notebookId,
                "notebook": {
                    "version": 3,
                    "language": "javascript",
                    "cells": [
                        {
                            "id": "f0627130-2e9c-11e9-9f0a-97b474081a71",
                            "cellType": "code",
                            "code": "console.log(\"fooey\");"
                        }
                    ]
                }
            });

        expect(evaluateResponse.status).toBe(200);

        let messages: any[] = [];
        
        while (true) {
            await sleep(100);

            //
            // Check evaluation status.
            //
            const statusResponse = await request().get("/status");

            //
            // Collect messages produced by the evaluation.
            //
            const messagesResponse = await request()
                .post("/messages")
                .send({ notebookId: notebookId });
            messages = messages.concat(messagesResponse.body.messages);

            expect(statusResponse.body.notebooks.length).toBe(1);

            if (!statusResponse.body.notebooks[0].working 
                && statusResponse.body.notebooks[0].success) {
                // Evaluation has completed.
                break;
            }
        }

        const stopResponse = await request()
            .post("/stop-evaluation")
            .send({ notebookId });
        expect(stopResponse.status).toBe(200);

        await sleep(100); // Give the worker a chance to stop.

        //
        // Remove debug messages.
        //
        messages = messages.filter(message => message.name !== "evaluation-event" || message.args.event !== "debug-log");

        expect(messages).toEqual([
            {
                "name": "evaluation-event",
                "args": {
                    "event": "notebook-eval-started"
                },
                "notebookId": "8471e81a-844b-49df-939d-9ee4672e0bc1"
            },
            {
                "name": "evaluation-event",
                "args": {
                    "event": "cell-eval-started",
                    "cellId": "f0627130-2e9c-11e9-9f0a-97b474081a71"
                },
                "notebookId": "8471e81a-844b-49df-939d-9ee4672e0bc1"
            },
            {
                "name": "evaluation-event",
                "args": {
                    "event": "receive-display",
                    "outputs": [
                        {
                            "cellId": "f0627130-2e9c-11e9-9f0a-97b474081a71",
                            "output": {
                                "displayType": "text",
                                "data": "fooey\n"
                            }
                        }
                    ]
                },
                "notebookId": "8471e81a-844b-49df-939d-9ee4672e0bc1"
            },
            {
                "name": "evaluation-event",
                "args": {
                    "event": "cell-eval-completed",
                    "cellId": "f0627130-2e9c-11e9-9f0a-97b474081a71"
                },
                "notebookId": "8471e81a-844b-49df-939d-9ee4672e0bc1"
            },
            {
                "name": "evaluation-event",
                "args": {
                    "event": "notebook-eval-completed"
                },
                "notebookId": "8471e81a-844b-49df-939d-9ee4672e0bc1"
            }
        ]);
    });
});
