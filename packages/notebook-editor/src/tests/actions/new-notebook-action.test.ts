import { NewNotebookAction } from "../../actions/new-notebook-action";

describe("new notebook action", () => {

    test("can invoke", async () => {
        const newNotebook = jest.fn();
        const mockContext: any = {
            getNotebookEditor: () => ({
                newNotebook: newNotebook,
            })
        };
        const action = new NewNotebookAction();
        await action.invoke(mockContext);
        expect(newNotebook).toBeCalledTimes(1);
    });
});