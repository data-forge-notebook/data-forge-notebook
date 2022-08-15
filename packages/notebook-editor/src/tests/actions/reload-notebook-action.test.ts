import { ReloadNotebookAction } from "../../actions/reload-notebook-action";

describe("reload notebook action", () => {

    test("can invoke", async () => {
        const reloadNotebook = jest.fn();
        const mockContext: any = {
            getNotebookEditor: () => ({
                reloadNotebook: reloadNotebook,
            })
        };
        const action = new ReloadNotebookAction();
        await action.invoke(mockContext);
        expect(reloadNotebook).toBeCalledTimes(1);
    });
});