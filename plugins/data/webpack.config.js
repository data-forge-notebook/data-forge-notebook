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

const mode = process.env.MODE;
if (!mode) {
    throw new Error(`MODE environment variable is not set.`);
}

if (mode !== "development" && mode !== "production") {
    throw new Error(`MODE environment variable is set to an invalid value: ${mode}, expected "development" or "production".`);
}

console.log(`Target: ${target}`);
console.log(`Mode: ${mode}`);

const defaultEnv = {
};
const processEnv = Object.assign(defaultEnv, process.env);

const devtools = {
    development: "inline-source-map",
    production: false,    
};

module.exports = {
    entry: {
        'index': [ path.resolve(target) ],
    },
    output: {
        globalObject: 'self',
        filename: "index.bundle.js",
        path: outputDir,
    },

    mode: mode,
    devtool: devtools[mode],

    performance: {
        hints: false,
    },

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
            ],
        }),
    ],
};
