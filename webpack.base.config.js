const webpack = require('webpack');
const ForkTsCheckerNotifierWebpackPlugin = require('fork-ts-checker-notifier-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const path = require("path");

module.exports = function (env) {

    const outputDir = path.resolve(__dirname, "dist", env);

    const targets = {
        electron: "web",
        default: "web",
    };

    return {
        entry: {
            'index': `./src/testbed/${env}.tsx`,
            'editor.worker': 'monaco-editor/esm/vs/editor/editor.worker.js',
            'json.worker': 'monaco-editor/esm/vs/language/json/json.worker',
            'css.worker': 'monaco-editor/esm/vs/language/css/css.worker',
            'html.worker': 'monaco-editor/esm/vs/language/html/html.worker',
            'ts.worker': 'monaco-editor/esm/vs/language/typescript/ts.worker'
        },
        output: {
            globalObject: 'self',
            filename: "[name].bundle.js",
            path: outputDir,
        },
    
        mode: "development",
    
        // Enable sourcemaps for debugging webpack's output.
        devtool: "inline-source-map",

        target: targets[env] || targets.default,
    
        devServer: {
            static: {
                directory: outputDir,
            },
            hot: false,
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
                ENVIRONMENT: env,
            }),
    
            new ForkTsCheckerWebpackPlugin(),
            new ForkTsCheckerNotifierWebpackPlugin({ title: 'TypeScript', excludeWarnings: false }),        
    
            new CopyWebpackPlugin({
                patterns: [
                    {
                        from: `./src/testbed/${env}.html`,
                        to: outputDir,
                    },
                    {
                        from: `./node_modules/normalize.css/normalize.css`,
                        to: outputDir,
                    },
                    {
                        from: `./node_modules/@blueprintjs/icons/lib/css/blueprint-icons.css`,
                        to: outputDir,
                    },
                    {
                        from: `./node_modules/@blueprintjs/core/lib/css/blueprint.css`,
                        to: outputDir,
                    },
                    {
                        from: `./src/testbed/styles`,
                        to: outputDir,
                    },
                ],
            }),
        ],
    };
}