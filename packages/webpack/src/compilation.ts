import path from 'path'

import { AsyncParallelHook } from 'tapable'

import { Chunk } from './Chunk'
import { Generator } from './generate'
import { FileModule } from './Module'
import { normalizePath } from './utils'

import type { TemptaleType } from './generate'
import type { EntryObject, WebpackResovleConfig } from './typings'
import type { InnerCallback } from 'tapable'

export class Compilation {
  // 本次编译产生的所有模块
  public modules: FileModule[] = []
  // 本次编译产生的所有代码块
  private chunks: Chunk[] = []
  // 本次编译所产生的资源文件，文件名 -> 资源代码
  public assets: Record<string, string> = {}
  // 记录每个 chunk 对应的生成器，chunkId -> Generator
  public generators: Record<string, Generator> = {}
  // hooks
  public hooks = {
    entry: new AsyncParallelHook<undefined>(['_']),
  }

  constructor(public config: WebpackResovleConfig) {}

  /**
   * 创建所有入口
   * @param context 入口上下文
   * @param entryObject 入口对象
   * @param callback 创建完成的回调
   */
  createEntry(
    context: string,
    entryObject: EntryObject,
    callback: InnerCallback<Error, void>
  ) {
    // 遍历所有入口，为每一个入口注册事件
    for (const chunkId in entryObject) {
      this.hooks.entry.tapAsync(`CreateEntry-${chunkId}`, (_, callback) => {
        this.createChunk(
          chunkId,
          entryObject[chunkId],
          normalizePath(path.resolve(context)),
          true,
          chunkId,
          callback
        )
      })
    }

    // 开始执行所有的创建入口事件
    this.hooks.entry.callAsync(undefined, callback)
  }

  /**
   * 创建 Chunk
   * @param chunkId 代码块名
   * @param entryFile 入口文件名
   * @param context 入口文件所属目录
   * @param entryed 是否是入口 chunk
   * @param entryChunkId 入口 chunk，默认为 chunkId
   */
  createChunk(
    chunkId: string,
    entryFile: string,
    context: string,
    entryed: boolean,
    entryChunkId: string,
    callback: InnerCallback<Error, void>
  ) {
    // 每创建一个 chunk，就会创建对应的生成器
    this.generators[chunkId] = new Generator(this.config)

    // 创建入口模块，并构建所有的依赖模块
    this.createModule(
      entryFile,
      context,
      chunkId,
      entryChunkId,
      (e, entryModule) => {
        if (e) {
          callback(e)
          return
        }

        // 构建完成创建 Chunk，这里需要确定所有的 module 都创建完成（必须要创建，loader可以不执行完）
        const chunk = new Chunk(
          chunkId,
          entryModule!,
          this.modules.filter(
            module =>
              module.chunkId === chunkId && module.file !== entryModule!.file
          ),
          entryed
        )

        this.chunks.push(chunk)

        callback(null)
      }
    )
  }

  /**
   * 创建模块
   * @param moduleFile
   * @param dir
   * @param chunkName
   * @param entryChunkId
   */
  createModule(
    moduleFile: string,
    dir: string,
    chunkName: string,
    entryChunkId: string,
    callback: InnerCallback<Error, FileModule>
  ) {
    // 创建模块对象
    const module = new FileModule(moduleFile, dir, chunkName, entryChunkId)
    this.modules.push(module)

    // 开始构建模块，构建完成通知外部
    module.build(this, e => {
      e ? callback(e) : callback(null, module)
    })
  }

  /**
   * 标记指定 chunk 下会用到的模板类型 type
   * @param chunkId
   * @param type
   */
  markTemplateType(chunkId: string, type: TemptaleType) {
    if (this.generators[chunkId]) {
      this.generators[chunkId].markTemplateType(type)
    }
  }

  /**
   * 创建资源
   */
  createAssets() {
    // 生成每个代码块的最终代码，记录在资源中
    this.chunks.forEach(chunk => {
      this.assets[chunk.chunkId] =
        this.generators[chunk.chunkId].generate(chunk)
    })

    return this.assets
  }
}
