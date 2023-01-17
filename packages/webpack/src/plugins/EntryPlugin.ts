import path from 'path'

import { normalizePath } from '../utils'

import type { Compiler } from '../compiler'
import type { WebpackPlugin } from '../typings'

/**
 * 处理入口 Plugin
 */
export class EntryPlugin implements WebpackPlugin {
  apply(compiler: Compiler) {
    // make 阶段执行
    compiler.hooks.entry.tap('EntryPlugin', (context, entry) => {
      compiler.hooks.make.tapPromise(
        'EntryMakePlugin',
        compilation =>
          new Promise(resolve => {
            // 遍历所有入口，为每一个入口创建 module
            for (const chunkName in entry) {
              // TODO: 添加新的入口

              compilation.createEntry(
                chunkName,
                entry[chunkName],
                normalizePath(path.resolve(context))
              )
            }

            // 所有入口创建完成后，开始创建资源
            compilation.createAssets()
            resolve()
          })
      )
    })
  }
}
