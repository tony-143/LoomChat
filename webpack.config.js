module.exports = {
    // Other webpack config...
    plugins: [
      // Other plugins...
    ],
    resolve: {
      fallback: {
        "crypto": false, // If simple-peer depends on crypto, disable it in the browser
        "stream": require.resolve("stream-browserify"),
        "global": require.resolve("global")
      }
    }
  };
  