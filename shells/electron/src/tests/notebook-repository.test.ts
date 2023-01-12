import { disableInjector } from "@codecapers/fusion";
import { NotebookRepository } from "../services/notebook-repository";

describe("electron / notebook-repository", () => {

    beforeAll(() => {
        disableInjector();
    });

    test("can write notebook", async () => {

        const notebookRepository = new NotebookRepository();
        
    });
});
