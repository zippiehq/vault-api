const path = require('path')
const webpack = require('webpack')
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: ['./src/example.js'],
  
  devServer: {
    https: true,
    port: 8444,
    contentBase: './dist'
  },

  plugins: [
    new HtmlWebpackPlugin({
      filename: './index.html'
   })
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};
