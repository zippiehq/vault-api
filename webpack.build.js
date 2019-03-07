const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'lib'),
    filename: 'vault-api.js',
    library: 'Vault',
    libraryExport: 'default',
    libraryTarget: 'umd',
  },
}