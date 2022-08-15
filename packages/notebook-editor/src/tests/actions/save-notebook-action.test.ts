import { SaveNotebookAction } from "../../actions/save-notebook-action";

describe("save notebook action", () => {

    test("can invoke", async () => {
        const saveNotebook = jest.fn();
        const mockContext: any = {
            getNotebookEditor: () => ({
                saveNotebook: saveNotebook,
            })
        };
        const action = new SaveNotebookAction();
        await action.invoke(mockContext);
        expect(saveNotebook).toBeCalledTimes(1);
    });
});