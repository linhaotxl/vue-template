import { Chunk } from './Chunk'
import { FileModule } from './Module'

import type { WebpackResovleConfig } from './typings'

export class Compilation {
  // 本次编译产生的所有模块
  public modules: FileModule[] = []
  // 本次编译产生的所有代码块
  private chunks: Chunk[] = []
  // 本次编译所产生的资源文件，文件名 -> 资源代码
  assets: Record<string, string> = {}

  constructor(public config: WebpackResovleConfig) {}

  /**
   * 创建入口 Chunk
   * @param chunkName 代码块名
   * @param entryFile 入口文件名
   * @param context 入口文件上下文
   */
  createChunk(
    chunkName: string,
    entryFile: string,
    context: string,
    entryed: boolean
  ) {
    // 创建入口模块
    const entryModule = this.createModule(entryFile, context, chunkName)
    // 创建入口 Chunk
    const chunk = new Chunk(
      chunkName,
      entryModule,
      this.modules.filter(
        module => module.chunk === chunkName && module.file !== entryModule.file
      ),
      entryed,
      this.config
    )

    this.chunks.push(chunk)
  }

  /**
   * 创建模块
   * @param {string} moduleFile 模块绝对路径
   * @param {string} dir 模块所在目录
   * @param {string} chunkName 代码块名
   */
  createModule(moduleFile: string, dir: string, chunkName: string) {
    const module = new FileModule(moduleFile, dir, chunkName)
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
   * 创建资源
   */
  createAssets() {
    // 生成每个代码块的最终代码，记录在资源中
    try {
      this.chunks.forEach(chunk => {
        const code = chunk.generate()
        code && (this.assets[chunk.chunkId] = code)
      })
    } catch (e) {
      console.log(e)
    }
  }
}
