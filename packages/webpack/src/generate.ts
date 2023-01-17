import path from 'path'
import { fileURLToPath } from 'url'

import ejs from 'ejs'

import { readFile } from './utils'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const mainTemplate = readFile(path.resolve(__dirname, 'template/main.ejs'))

export const generateMainCode = ejs.compile(mainTemplate)
