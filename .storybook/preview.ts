import { loadMonaco } from '../src/__fixtures__/load-monaco';

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