import { SyncHook, AsyncSeriesHook, AsyncParallelHook } from 'tapable'

import { Compilation } from './compilation'

import type { EntryObject, WebpackResovleConfig } from './typings'

export class Compiler {
  hooks = {
    // 处理入口
    entry: new SyncHook<[string, EntryObject]>(['context', 'entry']),
    // 开始运行前
    beforeRun: new AsyncSeriesHook<[Compiler]>(['compiler']),
    // 运行
    run: new AsyncSeriesHook<[Compiler]>(['compiler']),
    // 开始编译前
    beforeCompile: new AsyncSeriesHook(['params']),
    // 运行
    compile: new AsyncSeriesHook(['params']),
    // 构建
    make: new AsyncParallelHook<[Compilation]>(['compilation']),
    // 创建资源
    assets: new AsyncParallelHook<[Compilation]>(['compilation']),
    // 编译结束后
    done: new SyncHook(),
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
    // 先执行 beforeCompile 钩子
    const params = {}
    this.hooks.beforeCompile.callAsync(params, () => {
      // 再执行 compile 钩子
      this.hooks.compile.callAsync(params, () => {
        // 初始化编译器，开始执行 make 钩子进行编译
        const compilation = new Compilation(this.config)
        this.hooks.make.callAsync(compilation, () => {
          // 执行 assets 钩子，创建资源文件
          this.hooks.assets.callAsync(compilation, () => {
            // 最后执行 done 钩子
            this.hooks.done.call(undefined)
          })
        })
      })
    })
  }
}
