import type { Plugin } from '../plugin'

export async function resolvePlugins(
  prePlugins: Plugin[],
  normalPlugins: Plugin[],
  postPlugins: Plugin[]
): Promise<Plugin[]> {
  return [...prePlugins, ...normalPlugins, ...postPlugins]
}
