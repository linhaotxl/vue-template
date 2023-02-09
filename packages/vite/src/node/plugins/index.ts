import { htmlInlineProxyPlugin } from './html'

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
    ...normalPlugins,
    ...postPlugins,
  ]
}
