import { EvalNotebookAction } from "../../actions/eval-notebook-action";

describe("eval notebook action", () => {

    test("can invoke", async () => {
        const evaluateNotebook = jest.fn();
        const mockContext: any = {
            getNotebookEditor: () => ({
                evaluateNotebook: evaluateNotebook,
            })
        };
        const action = new EvalNotebookAction();
        await action.invoke(mockContext);
        expect(evaluateNotebook).toBeCalledTimes(1);
    });
});