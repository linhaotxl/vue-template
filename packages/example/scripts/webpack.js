const { webpack } = require('my-webpack')

const webpackConfig = require('../webpack.config')

const compiler = webpack(webpackConfig)

compiler.run()
