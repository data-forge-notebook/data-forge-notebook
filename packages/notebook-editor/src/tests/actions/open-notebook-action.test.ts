import { disableInjector } from "@codecapers/fusion";
import { OpenNotebookAction } from "../../actions/open-notebook-action";

describe("open notebook action", () => {

    beforeAll(() => {
        disableInjector();
    });

    test("can invoke", async () => {
        const openNotebook = jest.fn();
        const mockContext: any = {
            getNotebookEditor: () => ({
                openNotebook: openNotebook,
            }),
            getParams: () => ({
            }),
        };
        const action = new OpenNotebookAction();
        await action.invoke(mockContext);
        expect(openNotebook).toBeCalledTimes(1);
    });
});