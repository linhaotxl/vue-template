import { mkdir, normalizePath, toAbsolutePath, writeFile } from '../utils'

import type { Compiler } from '../compiler'
import type { WebpackPlugin } from '../typings'

export class AssetsPlugin implements WebpackPlugin {
  apply(compiler: Compiler): void {
    compiler.hooks.assets.tapPromise(
      'AssetsPlugin',
      compilation =>
        new Promise(resolve => {
          // 创建资源
          const assets = compilation.createAssets()

          // 所有编译结束，将代码块写入文件
          const { path: outputPath, filename: outputFilename } =
            compilation.config.output

          // 创建输出文件夹
          mkdir(normalizePath(toAbsolutePath(outputPath)))

          // 将资源内容写入资源文件中
          for (const asset in assets) {
            const assetFile = normalizePath(
              toAbsolutePath(
                outputFilename.replace('[name]', asset),
                outputPath
              )
            )
            writeFile(assetFile, compilation.assets[asset])
          }
          resolve()
        })
    )
  }
}
