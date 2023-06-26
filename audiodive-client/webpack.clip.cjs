const { merge } = require('webpack-merge');
const commonConfig = require('./webpack.common.cjs')
const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const devConfig = {
    devtool: 'eval-source-map',
    entry: path.resolve(__dirname, 'client', 'clip.jsx'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle-clip.js'
    },
    devServer: {
        static: path.join(__dirname, 'dist'),
        port: 61433,
        headers: {
            'Access-Control-Allow-Origin': '*'
        },
        hot: false,
        liveReload: false
    },
}

const productionConfig = {
    mode: 'production',
    entry: path.resolve(__dirname, 'client', 'clip.jsx'),
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle-clip.js'
    }
}

module.exports = (env, args) => {

    switch(args.mode) {

        case 'development':
            return merge(commonConfig, devConfig);

        case 'production':
            return merge(commonConfig, productionConfig);

        default:
            throw new Error('No matching configuration was found!');
    }
}