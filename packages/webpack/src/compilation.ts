import { Chunk } from './Chunk'
import { Generator } from './generate'
import { FileModule } from './Module'

import type { TemptaleType } from './generate'
import type { WebpackResovleConfig } from './typings'

export class Compilation {
  // 本次编译产生的所有模块
  public modules: FileModule[] = []
  // 本次编译产生的所有代码块
  private chunks: Chunk[] = []
  // 本次编译所产生的资源文件，文件名 -> 资源代码
  public assets: Record<string, string> = {}
  // 记录每个 chunk 对应的生成器，chunkId -> Generator
  public generators: Record<string, Generator> = {}

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
    entryChunkId: string = chunkId
  ) {
    // 每创建一个 chunk，就会创建对应的生成器
    this.generators[chunkId] = new Generator(this.config)

    // 创建入口模块
    const entryModule = this.createModule(
      entryFile,
      context,
      chunkId,
      entryChunkId
    )

    // 创建 Chunk
    const chunk = new Chunk(
      chunkId,
      entryModule,
      this.modules.filter(
        module => module.chunkId === chunkId && module.file !== entryModule.file
      ),
      entryed
    )

    this.chunks.push(chunk)
  }

  /**
   * 创建模块
   * @param {string} moduleFile 模块相对于根目录的路径
   * @param {string} dir 模块所在目录
   * @param {string} chunkName 模块所属的 chunk
   * @param {string} entryChunkId 模块所属的入口 chunk
   */
  createModule(
    moduleFile: string,
    dir: string,
    chunkName: string,
    entryChunkId: string
  ) {
    const module = new FileModule(moduleFile, dir, chunkName, entryChunkId)
    this.modules.push(module)

    this.buildModule(module)

    return module
  }

  /**
   * 打包模块
   * @param module 需要打包的模块
   */
  buildModule(module: FileModule) {
    module.build(this)
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
  }
}
