import { SyncHook, AsyncSeriesHook, AsyncParallelHook } from 'tapable'

import { Compilation } from './compilation'
import { mkdir, normalizePath, toAbsolutePath, writeFile } from './utils'

import type { EntryObject, WebpackResovleConfig } from './typings'

export class Compiler {
  hooks = {
    // 处理入口
    entry: new SyncHook<[string, EntryObject]>(['context', 'entry']),
    // 开始运行前
    beforeRun: new AsyncSeriesHook<[Compiler]>(['compiler']),
    // 运行
    run: new AsyncSeriesHook<[Compiler]>(['compiler']),
    // run: new AsyncSeriesHook(),
    // 开始编译前
    beforeCompile: new AsyncSeriesHook(['params']),
    // 运行
    compile: new AsyncSeriesHook(['params']),
    // 构建
    make: new AsyncParallelHook<[Compilation]>(['compilation']),
    // 创建资源
    assets: new AsyncParallelHook<[Compilation]>(['compilation']),

    done: new SyncHook(), // 编译结束后的 hook
  }

  constructor(private config: WebpackResovleConfig) {}

  run() {
    // 先执行 beforeRun 钩子，等所有的 beforeRun 执行完后再执行 run 钩子
    this.hooks.beforeRun.callAsync(this, () => {
      this.hooks.run.callAsync(this, () => {
        // 开始编译
        this.compile()
      })
    })
  }

  private compile() {
    // 先执行 beforeCompile 钩子，等所有的 beforeCompile 执行完后再执行 compile 钩子
    const params = {}
    this.hooks.beforeCompile.callAsync(params, () => {
      this.hooks.compile.callAsync(params, () => {
        // 初始化编译器，调用 make 钩子开始编译
        const compilation = new Compilation(this.config)
        this.hooks.make.callAsync(compilation, () => {
          this.writeFile(compilation)
        })
      })
    })
  }

  private writeFile(compilation: Compilation) {
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
