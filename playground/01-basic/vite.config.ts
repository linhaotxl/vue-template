import path from 'path'

interface Config {
  name: string
  file: string
}

const config: Config = {
  name: 'IconMan',
  file: path.resolve(process.cwd()),
}

export default config
