import { Compiler } from './compiler'
import { resolveConfig } from './config'

import type { WebpackUserConfig } from './typings/webpack'

export function webpack(inlineConfig: WebpackUserConfig) {
  // 1. 解析参数
  const config = resolveConfig(inlineConfig)

  // 2. 初始化编译器
  const compiler = new Compiler(config)

  // 3. 执行所有 plugin
  for (const plugin of config.plugins) {
    plugin.apply(compiler)
  }

  // 4. 触发 entry hook
  compiler.hooks.entry.call(config.context, config.entry)

  return compiler
}
