import type { Compiler } from '../compiler'
import type { WebpackPlugin } from '../typings'

export class AssetsPlugin implements WebpackPlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.assets.tapPromise(
      'AssetsPlugin',
      compilation =>
        new Promise(resolve => {
          compilation.createAssets()
          resolve()
        })
    )
  }
}
