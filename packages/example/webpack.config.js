const path = require('path')
// const { fileURLToPath } = require('url')

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

class WebpackRunPlugin {
  apply(compiler) {
    compiler.hooks.run.tap('WebpackRunPlugin', () => {
      console.log('开始编译')
    })
  }
}

class WebpackDonePlugin {
  apply(compiler) {
    compiler.hooks.done.tap('WebpackDonePlugin', () => {
      console.log('完成编译')
    })
  }
}

module.exports = {
  entry: './src/index.js',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },

  plugins: [new WebpackRunPlugin(), new WebpackDonePlugin()],

  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          code => `${code}\n"第一个 loader"`,
          code => `${code}\n"第二个 loader"`,
        ],
      },
    ],
  },
}
