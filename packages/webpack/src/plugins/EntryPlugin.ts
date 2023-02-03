import type { Compiler } from '../compiler'
import type { WebpackPlugin } from '../typings'

/**
 * 处理入口 Plugin
 */
export class EntryPlugin implements WebpackPlugin {
  apply(compiler: Compiler) {
    // make 阶段执行
    compiler.hooks.entry.tap('EntryPlugin', (context, entry) => {
      compiler.hooks.make.tapAsync(
        'EntryMakePlugin',
        (compilation, callback) => {
          compilation.createEntry(context, entry, callback)
        }
      )
    })
  }
}
