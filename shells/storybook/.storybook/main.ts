module.exports = {
    "stories": [
        "../src/**/*.stories.mdx",
        "../src/**/*.stories.@(js|jsx|ts|tsx)"
    ],
    "addons": [
        "@storybook/addon-links",
        "@storybook/addon-essentials",
        "@storybook/addon-interactions"
    ],
    "framework": "@storybook/react",
    "core": {
        "builder": "webpack5"
    },
    // https://storybook.js.org/docs/react/builders/webpack
    "webpackFinal": async (config: any) => {
        config.module.rules.push({
            test: /\.txt$/,
            type: 'asset/source',
        });

        return config;
    },
}