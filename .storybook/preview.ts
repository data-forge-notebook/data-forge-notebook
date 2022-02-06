import { loadMonaco } from '../src/__fixtures__/load-monaco';
import "../src/__fixtures__/services/plugin-repository";

export const parameters = {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
        matchers: {
            color: /(background|color)$/i,
            date: /Date$/,
        },
    },
}

export const loaders = [
    async () => {
        await loadMonaco();
    },
];