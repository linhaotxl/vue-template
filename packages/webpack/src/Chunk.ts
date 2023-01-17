import type { FileModule } from './Module'

export class Chunk {
  constructor(
    public name: string,
    public entryModule: FileModule,
    public dependenceModules: FileModule[]
  ) {}
}
