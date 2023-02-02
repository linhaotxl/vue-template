const loader2 = async function (code) {
  // const callback = this.async()

  // await sleep(3000)

  // callback(null, `${code}\n// loader2`)

  // console.log('loader2: ', code)
  return `${code}\n// loader2`
}

const sleep = time => new Promise(resolve => setTimeout(resolve, time))

// loader2.pitch = () => {
//   return '"loader2 pitch"'
// }

module.exports = loader2
