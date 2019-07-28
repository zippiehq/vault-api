const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('html-webpack-inline-source-plugin')

module.exports = {
  mode: 'development',
  entry: ['./test/setup.js','./test/test.js'],
  
  devServer: {
    https: true,
    port: 4000,
    contentBase: './dist',
    disableHostCheck: true
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: './test/index.html',
      filename: './index.html',
      inlineSource: '.(js|css)$'
   }),
   new HtmlWebpackInlineSourcePlugin()
  ],

  resolve: {
    alias: {
      'https://unpkg.com/chai@4.1.2/chai.js': 'chai/chai.js'
    }
  },

  module: {
    rules: [
      {
        test: require.resolve('chai/chai.js'),
        use: 'script-loader'
      }
    ]
 },

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};
