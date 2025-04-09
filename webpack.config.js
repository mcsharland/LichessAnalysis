const path = require("path");

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: {
    contentScript: "./src/contentScript.ts",
    background: "./src/background.ts",
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
};
