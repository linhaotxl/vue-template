import { isString } from './utils'

import type {
  WebpackConfigModule,
  WebpackResovleConfig,
  WebpackUserConfig,
} from './typings/webpack'

export function resolveConfig(config: WebpackUserConfig): WebpackResovleConfig {
  const { extensions = ['.js'], entry, plugins = [], module = {} } = config

  const resolveEntry = isString(entry) ? { main: entry } : entry

  const resolveModule: Required<WebpackConfigModule> = {
    ...module,
    rules: [],
  }
  if (module.rules) {
    resolveModule.rules = module.rules
  }

  return {
    ...config,
    extensions,
    entry: resolveEntry,
    plugins,
    module: resolveModule,
  }
}
