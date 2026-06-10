const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/'
  },
  module: {
    rules: [
      { test: /\.jsx?$/, use: 'babel-loader', exclude: /node_modules/ },
      { test: /\.css$/, use: ['style-loader','css-loader'] }
    ]
  },
  devServer: {
    historyApiFallback: true,
    port: 3000
  },
  plugins: [new HtmlWebpackPlugin({ template: './public/index.html' })],
  resolve: { extensions: ['.js', '.jsx'] }
};
