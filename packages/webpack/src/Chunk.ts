import { Generator } from './generate'

import type { FileModule } from './Module'
import type { WebpackResovleConfig } from './typings'

export class Chunk {
  private generator

  constructor(
    public chunkId: string,
    public entryModule: FileModule,
    public dependenceModules: FileModule[],
    public entryed: boolean,
    private config: WebpackResovleConfig
  ) {
    this.generator = new Generator(this.config)
  }

  generate() {
    if (this.entryed) {
      return this.generator.generateMain(this)
    } else {
      return this.generator.generateAsyncChunk(this)
    }
  }
}
