const webpack = require('webpack');
const ForkTsCheckerNotifierWebpackPlugin = require('fork-ts-checker-notifier-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const outputDir = __dirname;

module.exports = {
    entry: {
        "editor-test": "./src/__fixtures__/editor-test.tsx",
    },
    output: {
        filename: "[name].js",
        path: outputDir,
    },

    mode: "development",

    // Enable sourcemaps for debugging webpack's output.
    devtool: "inline-source-map",

    devServer: {
        contentBase: outputDir,
        hotOnly: true,

        // https://medium.com/@drgenejones/proxying-an-external-api-with-webpack-serve-code-and-a-restful-data-from-separate-endpoints-4da9b8daf430
        proxy: {
            '/api': {
                target: 'http://localhost:3000',
                secure: false
            }
        },
    },

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: "shebang-loader",
            },

            // { test: /\.tsx?$/, loader: "awesome-typescript-loader", options: { transpileOnly: true } },
            { 
                test: /\.tsx?$/, 
                loader: "ts-loader", 
                options: { transpileOnly: true },
            },

            // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
            { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
        ]
    },

    plugins: [
        new ForkTsCheckerWebpackPlugin({
            eslint: false
        }),
        new ForkTsCheckerNotifierWebpackPlugin({ title: 'TypeScript', excludeWarnings: false }),        

        // https://hackernoon.com/react-with-typescript-and-webpack-654f93f34db6
        new webpack.HotModuleReplacementPlugin(),
    ],
};