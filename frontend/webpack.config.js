const path = require('path');
const webpack = require('webpack');

module.exports = {
  // Other Webpack configuration options...
  resolve: {
    fallback: {
      "buffer": require.resolve("buffer/")
    }
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer']
    })
  ]
};
