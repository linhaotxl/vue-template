import path from 'path'
import { fileURLToPath } from 'url'

import ejs from 'ejs'

import { readFile } from './utils'

import type { Chunk } from './Chunk'
import type { WebpackResovleConfig } from './typings'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const mainTemplatePath = path.resolve(__dirname, 'template/main.ejs')
const mainTemplate = readFile(mainTemplatePath)

const asyncChunkTemplatePath = path.resolve(
  __dirname,
  'template/async-chunk.ejs'
)
const asyncChunkTemplate = readFile(asyncChunkTemplatePath)

const enum TemptaleType {
  Main = 'main',
  AsyncChunk = 'asyncChunk',
  Global = 'global',
  PublicPath = 'publicPath',
}

export const generateTypeMap: Record<TemptaleType, boolean | string[]> = {
  [TemptaleType.Main]: true,
  [TemptaleType.AsyncChunk]: false,
  [TemptaleType.Global]: false,
  [TemptaleType.PublicPath]: false,
}

const generateDeps: Record<TemptaleType, TemptaleType[]> = {
  [TemptaleType.Main]: [],
  [TemptaleType.AsyncChunk]: [TemptaleType.Global, TemptaleType.PublicPath],
  [TemptaleType.Global]: [],
  [TemptaleType.PublicPath]: [],
}

export class Generator {
  private generateTypeMap: Record<TemptaleType, boolean> = {
    [TemptaleType.Main]: true,
    [TemptaleType.AsyncChunk]: true,
    [TemptaleType.Global]: true,
    [TemptaleType.PublicPath]: true,
  }

  constructor(private config: WebpackResovleConfig) {}

  generateMain(chunk: Chunk) {
    const params = Object.entries(this.generateTypeMap).reduce(
      (prev, [type, valid]) => {
        prev[type] = valid
        if (valid) {
          generateDeps[type as TemptaleType].forEach(t => {
            prev[t] = true
          })
        }
        return prev
      },
      {} as Record<string, boolean>
    )

    return ejs.render(mainTemplate, {
      filename: mainTemplatePath,
      chunk,
      packageName: this.config.pkg.name,
      ...params,
    })
  }

  generateAsyncChunk(chunk: Chunk) {
    return ejs.render(asyncChunkTemplate, {
      filename: asyncChunkTemplatePath,
      packageName: this.config.pkg.name,
      chunk,
    })
  }
}
