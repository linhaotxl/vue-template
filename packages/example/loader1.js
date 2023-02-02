const loader1 = code => {
  // console.log('loader1: ', code)
  return `${code}\n// loader1`
}

// loader1.pitch = () => {
//   return 'loader1 pitch'
// }

module.exports = loader1
