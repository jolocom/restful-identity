
const path = require('path');

module.exports = {
  entry: './src/server.ts',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.node$/,
        use: 'node-loader'
      }
    ]
  },
  target: 'node',
  resolve: {
    extensions: [ '.tsx', '.ts', '.js' ]
  },
  externals: {
    
  },
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, 'dist')
  }
};
