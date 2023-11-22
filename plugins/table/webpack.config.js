const webpack = require('webpack');
// const ForkTsCheckerNotifierWebpackPlugin = require('fork-ts-checker-notifier-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require("path");

const outputDir = path.resolve(process.cwd(), "dist");
console.log(`Output: ${outputDir}`);

const target = process.env.TARGET;
if (!target) {
    throw new Error(`TARGET environment variable is not set.`);
}

console.log(`Target: ${target}`);

const defaultEnv = {
};
const processEnv = Object.assign(defaultEnv, process.env);

module.exports = {
    entry: {
        'index': [ path.resolve(target) ],
    },
    output: {
        globalObject: 'self',
        filename: "index.bundle.js",
        path: outputDir,
    },

    mode: "development",

    // Enable sourcemaps for debugging webpack's output.
    devtool: "inline-source-map",

    target: "web",

    devServer: {
        static: {
            directory: outputDir,
        },
        hot: false,
        liveReload: false,
        allowedHosts: "all",
    },

    resolve: {
        // Add '.ts' and '.tsx' as resolvable extensions.
        extensions: [".ts", ".tsx", ".js", ".json"],

        fallback: {
            // Allows the path Node.js module to be used in Weback bundled code.
            "path": require.resolve("path-browserify"),
        },
    },

    module: {
        rules: [
            {
                test: /\.css$/,
                use: ['style-loader', 'css-loader']
            },

            {
                test: /\.ttf$/,
                use: ['file-loader']
            },

            {
                test: /\.txt$/,
                type: 'asset/source',
            },

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
        
        new webpack.EnvironmentPlugin({
            // Configure environment variables here.
            ...processEnv,
        }),

        new ForkTsCheckerWebpackPlugin(),
        // new ForkTsCheckerNotifierWebpackPlugin({ title: 'TypeScript', excludeWarnings: false }),        

        new CopyWebpackPlugin({
            patterns: [
                {
                    from: `./index.html`,
                    to: outputDir,
                },
                {
                    from: `./src/index.css`,
                    to: outputDir,
                },
            ],
        }),
    ],
};
