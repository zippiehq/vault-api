const path = require('path')
const webpack = require('webpack')

module.exports = {
  mode: 'development',
  entry: './src/test.js',
  
  devServer: {
    https: true,
    port: 8444,
    contentBase: './dist',
    hot: true
  },

  plugins: [
    new webpack.HotModuleReplacementPlugin()
  ],
	
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  }
};
