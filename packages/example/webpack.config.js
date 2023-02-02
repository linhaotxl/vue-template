const path = require('path')
// const { fileURLToPath } = require('url')

// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

// before run: 2s
class WebpackBeforeRun1Plugin {
  apply(complier) {
    complier.hooks.beforeRun.tapAsync(
      'WebpackBeforeRun1Plugin',
      (compiler, callback) => {
        // console.log('[info]: WebpackBeforeRun1Plugin 开始执行')
        setTimeout(() => {
          // console.log('[info]: WebpackBeforeRun1Plugin 2s 后执行完成')
          callback()
        }, 2000)
      }
    )
  }
}

// before run 1s
class WebpackBeforeRun2Plugin {
  apply(complier) {
    complier.hooks.beforeRun.tapPromise(
      'WebpackBeforeRun2Plugin',
      () =>
        new Promise(resolve => {
          // console.log('[info]: WebpackBeforeRun2Plugin 开始执行')
          setTimeout(() => {
            // console.log('[info]: WebpackBeforeRun2Plugin 1s 后执行完成')
            resolve()
          }, 1000)
        })
    )
  }
}

// run 2s
class WebpackRun1Plugin {
  apply(complier) {
    complier.hooks.run.tapAsync('WebpackRun1Plugin', (compiler, callback) => {
      // console.log('[info]: WebpackRun1Plugin 开始执行')
      setTimeout(() => {
        // console.log('[info]: WebpackRun1Plugin 2s 后执行完成')
        callback()
      }, 2000)
    })
  }
}

// run 1s
class WebpackRun2Plugin {
  apply(complier) {
    complier.hooks.run.tapPromise(
      'WebpackRunPlugin',
      () =>
        new Promise(resolve => {
          // console.log('[info]: WebpackRun2Plugin 开始执行')
          setTimeout(() => {
            // console.log('[info]: WebpackRun2Plugin 1s 后执行完成')
            resolve()
          }, 1000)
        })
    )
  }
}

module.exports = {
  mode: 'development',

  entry: {
    main1: './src/index.js',
    main2: './src/index2.js',
  },

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },

  plugins: [
    // new WebpackBeforeRun1Plugin(),
    // new WebpackBeforeRun2Plugin(),
    // new WebpackRun1Plugin(),
    // new WebpackRun2Plugin(),
  ],

  module: {
    rules: [
      {
        test: /\.js$/,
        use: [
          path.resolve(__dirname, 'loader1.js'),
          path.resolve(__dirname, 'loader2.js'),
          // loader2,
          // code => `${code}\n // "第一个 loader"`,
          // code => `${code}\n // "第二个 loader"`,
        ],
      },
    ],
  },
}
