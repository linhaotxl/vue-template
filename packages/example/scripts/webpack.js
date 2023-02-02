// process.env.DEBUG = 'my-webpack:'

// const webpack = require('webpack')
const { webpack } = require('my-webpack')

const myWebpackConfig = require('../my-webpack.config')
// const webpackConfig = require('../webpack.config')

// const compiler = webpack(webpackConfig)
const compiler = webpack(myWebpackConfig)

compiler.run()
