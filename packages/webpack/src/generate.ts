import path from 'path'
import { fileURLToPath } from 'url'

import ejs from 'ejs'

import { readFile } from './utils'

import type { Chunk } from './Chunk'
import type { WebpackResovleConfig } from './typings'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// 主模板路径
const mainTemplatePath = path.resolve(__dirname, 'template/main.ejs')
const mainTemplate = readFile(mainTemplatePath)

// 异步 chunk 模板路径
const asyncChunkTemplatePath = path.resolve(
  __dirname,
  'template/async-chunk.ejs'
)
const asyncChunkTemplate = readFile(asyncChunkTemplatePath)

/**
 * 模板类型
 */
export const enum TemptaleType {
  // 主模板
  Main = 'main',
  // 异步 chunk 模板
  AsyncChunk = 'asyncChunk',
  // 全局变量模板
  Global = 'global',
  // 公共路径模板
  PublicPath = 'publicPath',
}

/**
 * 模板之间的依赖关系
 * key 是模板类型，value 是该模板需要依赖哪些模板
 */
const generateDeps: Record<TemptaleType, TemptaleType[]> = {
  [TemptaleType.Main]: [],
  [TemptaleType.AsyncChunk]: [TemptaleType.Global, TemptaleType.PublicPath],
  [TemptaleType.Global]: [],
  [TemptaleType.PublicPath]: [],
}

export class Generator {
  private generateTypeMap: Record<TemptaleType, boolean> = {
    [TemptaleType.Main]: true,
    [TemptaleType.AsyncChunk]: false,
    [TemptaleType.Global]: false,
    [TemptaleType.PublicPath]: false,
  }

  constructor(private config: WebpackResovleConfig) {}

  /**
   * 生成入口 chunk 代码
   * @param chunk 入口 chunk
   * @returns
   */
  private generateMain(chunk: Chunk) {
    const params = Object.entries(this.generateTypeMap).reduce(
      (prev, [type, valid]) => {
        if (valid) {
          prev[type as TemptaleType] = valid
          generateDeps[type as TemptaleType].forEach(t => {
            prev[t] = true
          })
        }
        return prev
      },
      this.generateTypeMap
    )

    return ejs.render(mainTemplate, {
      filename: mainTemplatePath,
      chunk,
      packageName: this.config.pkg.name,
      ...params,
    })
  }

  /**
   * 生成异步加载 chunk 代码
   * @param chunk 异步加载 chunk
   * @returns
   */
  private generateAsyncChunk(chunk: Chunk) {
    return ejs.render(asyncChunkTemplate, {
      filename: asyncChunkTemplatePath,
      packageName: this.config.pkg.name,
      chunk,
    })
  }

  /**
   * 生成 chunk 对应的代码
   * @param chunk
   * @returns
   */
  generate(chunk: Chunk) {
    return chunk.entryed
      ? this.generateMain(chunk)
      : this.generateAsyncChunk(chunk)
  }

  /**
   * 标记模板类型以及其所有依赖，表明用到了这个类型模板的代码
   * @param type 模板类型
   */
  markTemplateType(type: TemptaleType) {
    this.generateTypeMap[type] = true
  }
}
