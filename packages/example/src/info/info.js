const { age } = require('./age')
// const { name } = require('./name')

module.exports = {
  async print() {
    const { name } = await import(/* webpackChunkName: 'name' */ './name')
    const realName = await name()
    return 'name is ' + realName + ' and age is ' + age
  },
}
