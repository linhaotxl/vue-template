import { innerPlugins } from './plugins'
import { isString, readFile, toAbsolutePath } from './utils'

import type {
  WebpackConfigModule,
  WebpackResovleConfig,
  WebpackUserConfig,
} from './typings/webpack'

export function resolveConfig(config: WebpackUserConfig): WebpackResovleConfig {
  const {
    extensions = ['.js'],
    entry,
    plugins,
    module = {},
    context = process.cwd(),
  } = config

  const resolvePlugins = plugins ? [...innerPlugins, ...plugins] : innerPlugins
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
    context,
    extensions,
    entry: resolveEntry,
    plugins: resolvePlugins,
    module: resolveModule,
    pkg: JSON.parse(readFile(toAbsolutePath('./package.json'))),
  }
}
