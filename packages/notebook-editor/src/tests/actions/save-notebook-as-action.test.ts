import { SaveNotebookAsAction } from "../../actions/save-notebook-as-action";

describe("save notebook as action", () => {

    test("can invoke", async () => {
        const saveNotebookAs = jest.fn();
        const mockContext: any = {
            getNotebookEditor: () => ({
                saveNotebookAs: saveNotebookAs,
            })
        };
        const action = new SaveNotebookAsAction();
        await action.invoke(mockContext);
        expect(saveNotebookAs).toBeCalledTimes(1);
    });
});