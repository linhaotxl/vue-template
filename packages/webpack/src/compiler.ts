import { SyncHook } from 'tapable'

import { Compilation } from './compilation'
import { mkdir, normalizePath, toAbsolutePath, writeFile } from './utils'

import type { WebpackResovleConfig } from './typings'

export class Compiler {
  private hooks = {
    run: new SyncHook(), // 编译开始前的 hook
    done: new SyncHook(), // 编译结束后的 hook
  }

  constructor(private config: WebpackResovleConfig) {}

  run() {
    // 触发开始编译 hook
    this.hooks.run.call(undefined)

    // 初始化编译，调用 build 开始编译
    const compilation = new Compilation(this.config)
    compilation.build()

    // 触发结束编译 hook
    this.hooks.done.call(undefined)

    // 所有编译结束，将代码块写入文件
    const { path: outputPath, filename: outputFilename } = this.config.output
    mkdir(normalizePath(toAbsolutePath(outputPath)))
    for (const asset in compilation.assets) {
      const assetFile = normalizePath(
        toAbsolutePath(outputFilename.replace('[name]', asset), outputPath)
      )
      writeFile(assetFile, compilation.assets[asset])
    }
  }
}
