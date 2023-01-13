const { firstName } = require('./fullName/firstName')
const { lastName } = require('./fullName/lastName')
module.exports = {
  name: firstName + ' ' + lastName,
}
