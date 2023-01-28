import type { FileModule } from './Module'

export class Chunk {
  constructor(
    /**
     * chunk 对应的 name，入口则是 entry 中的 key，异步 chunk 则是魔法注释中的 name
     */
    public chunkId: string,

    /**
     * chunk 的入口模块
     */
    public entryModule: FileModule,

    /**
     * chunk 下所有的依赖模块，排除入口模块
     */
    public dependenceModules: FileModule[],

    /**
     * 是否是入口 chunk，而非异步 chunk
     */
    public entryed: boolean
  ) {}
}
