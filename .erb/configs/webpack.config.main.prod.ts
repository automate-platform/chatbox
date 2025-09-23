/**
 * Webpack config for production electron main process
 */

import path from 'path'
import TerserPlugin from 'terser-webpack-plugin'
import webpack from 'webpack'
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer'
import { merge } from 'webpack-merge'
import JavaScriptObfuscator from 'webpack-obfuscator'
import checkNodeEnv from '../scripts/check-node-env'
import baseConfig from './webpack.config.base'
import webpackPaths from './webpack.paths'
import MiniCssExtractPlugin from 'mini-css-extract-plugin'

checkNodeEnv('production')

const configuration: webpack.Configuration = {
    devtool: false,

    mode: 'production',

    target: 'electron-main',
    resolve: {
        extensions: ['.ts', '.js', '.json', '.node'],
    },

    entry: {
        main: path.join(webpackPaths.srcMainPath, 'main.ts'),
        preload: path.join(webpackPaths.srcMainPath, 'preload.ts'),
    },

    output: {
        path: webpackPaths.distMainPath,
        filename: '[name].js',
        library: {
            type: 'umd',
        },
    },

    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true,
            }),
        ],
    },

    plugins: [
        new BundleAnalyzerPlugin({
            analyzerMode: process.env.ANALYZE === 'true' ? 'server' : 'disabled',
            analyzerPort: 8888,
        }),
        new MiniCssExtractPlugin({
            filename: '[name].[contenthash].css', // CSS文件放在assets/css目录下 - 又不放了，因为这样会导致非web端的字体文件引用路径出错
        }),

        /**
         * Create global constants which can be configured at compile time.
         *
         * Useful for allowing different behaviour between development builds and
         * release builds
         *
         * NODE_ENV should be production so that modules do not perform certain
         * development checks
         */
        new webpack.EnvironmentPlugin({
            NODE_ENV: 'production',
            DEBUG_PROD: false,
            START_MINIMIZED: false,
        }),

        new webpack.DefinePlugin({
            'process.type': '"browser"',
        }),

        new JavaScriptObfuscator({
            target: 'node',
            optionsPreset: 'default',
            // 默认的变量名混淆，可能被误报为恶意代码
            identifierNamesGenerator: 'mangled-shuffled',
        }),
    ],

    /**
     * Disables webpack processing of __dirname and __filename.
     * If you run the bundle in node.js it falls back to these values of node.js.
     * https://github.com/webpack/webpack/issues/2010
     */
    node: {
        __dirname: false,
        __filename: false,
    },
    module: {
        rules: [
            {
                test: /\.s?(a|c)ss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    {
                        loader: 'css-loader',
                        options: {
                            modules: true,
                            sourceMap: true,
                            importLoaders: 1,
                        },
                    },
                    'sass-loader',
                ],
                include: /\.module\.s?(c|a)ss$/,
            },
            {
                test: /\.s?(a|c)ss$/,
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader', 'postcss-loader'],
                exclude: /\.module\.s?(c|a)ss$/,
                sideEffects: true,
            },
            // Fonts
            {
                test: /\.(woff|woff2|eot|ttf|otf)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/fonts/[name].[hash][ext]', // 字体资源放在assets/fonts目录下
                },
            },
            // Images
            {
                test: /\.(png|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'assets/images/[name].[hash][ext]', // 图片资源放在assets/images目录下
                },
            },
            // SVG
            {
                test: /\.svg$/,
                use: [
                    {
                        loader: '@svgr/webpack',
                        options: {
                            prettier: false,
                            svgo: false,
                            svgoConfig: {
                                plugins: [{ removeViewBox: false }],
                            },
                            titleProp: true,
                            ref: true,
                        },
                    },
                    'file-loader',
                ],
            },
        ],
    },
}

export default merge(baseConfig, configuration)
