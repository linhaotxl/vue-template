import { htmlInlineProxyPlugin } from './html'
import { importAnalysisPlugin } from './importAnalysis'
import { resolvePlugin } from './resolve'

import type { ResolvedConfig } from '../config'
import type { Plugin } from '../plugin'

export async function resolvePlugins(
  config: ResolvedConfig,
  prePlugins: Plugin[],
  normalPlugins: Plugin[],
  postPlugins: Plugin[]
): Promise<Plugin[]> {
  return [
    ...prePlugins,
    htmlInlineProxyPlugin(config),

    // resolvePlugin(),

    importAnalysisPlugin(config),

    ...normalPlugins,
    ...postPlugins,
  ]
}
