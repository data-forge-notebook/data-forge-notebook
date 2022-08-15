import { OpenNotebookAction } from "../../actions/open-notebook-action";

describe("open notebook action", () => {

    test("can invoke", async () => {
        const openNotebook = jest.fn();
        const mockContext: any = {
            getNotebookEditor: () => ({
                openNotebook: openNotebook,
            })
        };
        const action = new OpenNotebookAction();
        await action.invoke(mockContext);
        expect(openNotebook).toBeCalledTimes(1);
    });
});