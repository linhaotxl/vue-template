const { print } = require('./info/info')

;(async () => {
  console.log('入口文件: ', await print())
})()
