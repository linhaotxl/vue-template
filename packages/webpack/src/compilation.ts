import { AsyncParallelHook } from 'tapable'

import { Chunk } from './Chunk'
import { Generator } from './generate'
import { FileModule } from './Module'

import type { TemptaleType } from './generate'
import type {
  Callback,
  CreateChunkCallback,
  CreateModuleCallback,
  WebpackResovleConfig,
} from './typings'

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
  // public hooks = {
  //   loaders: new AsyncParallelHook(),
  // }

  constructor(public config: WebpackResovleConfig) {}

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
    callback?: CreateChunkCallback
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
          callback?.(e)
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

        callback?.(null, chunk)
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
    callback?: CreateModuleCallback
  ) {
    const module = new FileModule(moduleFile, dir, chunkName, entryChunkId)
    this.modules.push(module)

    module.build(this, e => {
      e ? callback?.(e) : callback?.(null, module)
    })
  }

  // createEntryModule(
  //   moduleFile: string,
  //   dir: string,
  //   chunkName: string,
  //   entryChunkId: string,
  //   callback: CreateModuleCallback
  // ) {
  //   this.createModule(moduleFile, dir, chunkName, entryChunkId)
  //   const module = new FileModule(moduleFile, dir, chunkName, entryChunkId)
  //   this.modules.push(module)

  //   module.build(this, e => {
  //     e ? callback(e) : callback(null, module)
  //   })
  // }

  /**
   * 创建模块
   * @param {string} moduleFile 模块相对于根目录的路径
   * @param {string} dir 模块所在目录
   * @param {string} chunkName 模块所属的 chunk
   * @param {string} entryChunkId 模块所属的入口 chunk
   */
  // createModule(
  //   moduleFile: string,
  //   dir: string,
  //   chunkName: string,
  //   entryChunkId: string,
  //   callback: Callback
  // ) {
  //   const module = new FileModule(moduleFile, dir, chunkName, entryChunkId)
  //   this.modules.push(module)

  //   module.build(this, callback)

  //   return module
  // }

  /**
   * 打包模块
   * @param module 需要打包的模块
   */
  // buildModule(module: FileModule) {
  //   module.build(this)
  // }

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
  }
}
