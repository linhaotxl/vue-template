const loader3 = code => {
  // console.log('loader3: ', code)
  return `${code}\n// loader3`
}

// loader1.pitch = () => {
//   return 'loader1 pitch'
// }

module.exports = loader3
