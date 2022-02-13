const webpack = require('webpack');
const ForkTsCheckerNotifierWebpackPlugin = require('fork-ts-checker-notifier-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

const outputDir = __dirname;

module.exports = {
    entry: {
        "testbed": "./src/__fixtures__/testbed.tsx",
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
        hot: false,
    },

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"]
    },

    module: {
        rules: [
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