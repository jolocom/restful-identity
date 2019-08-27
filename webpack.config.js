
const path = require('path');

const pr = res => dir => file => res.resolve(dir, file);
const prh = pr(path)(__dirname);
const sh = prh('shim.js');

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
    extensions: [ '.tsx', '.ts', '.js' ],
    alias: {
      electron: sh,
      "./build/Release/scrypt": sh,
      "uglify-es/package.json": sh,
      "uglify-es": sh,
      "rdf-canonize-native": sh,
      "pino-pretty": sh,
      "long": sh,
      "../build/default/validation": sh,
      "../build/default/bufferutil": sh,
      "../build/Release/validation": sh,
      "../build/Release/bufferutil": sh,
      "./package": sh
    }
  },
    externals: {
      
    },
  output: {
    filename: 'server.js',
    path: prh('dist')
  }
};
