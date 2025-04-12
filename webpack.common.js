const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");
const HtmlPlugin = require("html-webpack-plugin");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const webpack = require("webpack");

module.exports = {
  entry: {
    popup: path.resolve("src/popup/popup.tsx"),
    offscreen: path.resolve("src/offscreen/offscreen.tsx"),
    options: path.resolve("src/options/options.tsx"),
    background: path.resolve("src/background/background.ts"),
    contentScript: path.resolve("src/contentScript/contentScript.tsx"),
    camera: path.resolve("src/contentScript/camera.tsx"),
    enableCamera: path.resolve("src/pages/enableCamera.tsx"),
    enableCameraVideo: path.resolve("src/pages/enableCameraVideo.tsx"),
    video: path.resolve("src/contentScript/video.tsx"),
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader", "postcss-loader"],
      },
      {
        test: /\.(jpg|jpeg|png|woff|woff2|eot|ttf|svg)$/,
        type: "asset/resource",
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new CleanWebpackPlugin({
      cleanStaleWebpackAssets: false,
    }),
    new CopyPlugin({
      patterns: [
        {
          from: path.resolve("src/static"),
          to: path.resolve("dist"),
        },
      ],
    }),
    // new webpack.IgnorePlugin({
    //   resourceRegExp: /^@ffmpeg\/(ffmpeg|utils)$/,
    // }),
    ...getHtmlPlugins([
      "popup",
      "options",
      "offscreen",
      "video",
      "enableCamera",
      "enableCameraVideo",
    ]),
  ],
  output: {
    filename: "[name].js",
    path: path.resolve("dist"),
  },
  optimization: {
    splitChunks: {
      chunks(chunk) {
        return (
          chunk.name !== "contentScript" &&
          chunk.name !== "background" &&
          chunk.name !== "camera" &&
          chunk.name !== "enableCamera" &&
          chunk.name !== "enableCameraVideo" &&
          chunk.name !== "offscreen"
        );
      },
    },
  },
};

function getHtmlPlugins(chunks) {
  return chunks.map(
    (chunk) =>
      new HtmlPlugin({
        title: "React Extension",
        filename: `${chunk}.html`,
        chunks: [chunk],
      })
  );
}
