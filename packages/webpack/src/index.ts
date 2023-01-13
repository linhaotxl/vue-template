import { Compiler } from './compiler'
import { resolveConfig } from './config'

import type { WebpackUserConfig } from './typings/webpack'

export function webpack(inlineConfig: WebpackUserConfig) {
  // 解析参数
  const config = resolveConfig(inlineConfig)

  // 初始化编译器
  const compiler = new Compiler(config)

  // 执行所有 plugin
  for (const plugin of config.plugins) {
    plugin.apply(compiler)
  }

  return compiler
}
