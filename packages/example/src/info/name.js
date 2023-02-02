// const { firstName } = require('./fullName/firstName')
// const { lastName } = require('./fullName/lastName')
module.exports = {
  async name() {
    const { firstName } = await import(
      /* webpackChunkName: 'firstName' */ './fullName/firstName'
    )
    const { lastName } = await import(
      /* webpackChunkName: 'lastName' */ './fullName/lastName'
    )
    return firstName + lastName
  },
}
