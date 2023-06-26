const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const ProvidePlugin = require('webpack').ProvidePlugin
const webpack = require('webpack')

module.exports = {
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'style.css'
        }),
        new webpack.HotModuleReplacementPlugin()
    ],
    resolve: {
        alias: {
            videojs: "video.js",
            WaveSurfer: "wavesurfer.js",
            RecordRTC: "recordrtc"
        },
        fallback: {
            "fs": false,
            "path": false
        },
        extensions: ['.js', '.jsx']
    },
    module: {
        rules: [
            {
                test: /\.(jsx|js)$/,
                exclude: /node_modules/,
                use: {
                    loader: "babel-loader",
                },
                resolve: {
                    fullySpecified: false, // disable the behaviour
                }
            },
            {
                test: /\.(scss|css)$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            },
            {
                test: /\.(jpe?g|svg|png|gif|ico|eot|ttf|woff2?)(\?v=\d+\.\d+\.\d+)?$/i,
                type: 'asset/resource',
            }
        ]
    }
};