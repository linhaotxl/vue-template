import { createPluginHookUtils } from '../plugin'
import { isObject, isString } from '../utils'

import type { ResolvedConfig } from '../config'
import type { LoadResult, PartialResolvedId, SourceDescription } from 'rollup'

export interface PluginContainer {
  /**
   * 解析路径为硬盘上的真是路径
   * @param id 原始 id
   * @param importer 被导入文件的绝对路径
   * @param options 参数
   * @returns id 对应的绝对路径
   */
  resolveId(
    id: string,
    importer?: string,
    options?: {}
  ): Promise<PartialResolvedId | null>

  /**
   * 加载解析好的文件内容
   * @param id 上一步解析到的绝对路径
   * @param options 参数
   * @returns 加载好的代码
   */
  load(id: string, options?: {}): Promise<LoadResult>

  /**
   * 转换上一步加载好的代码
   * @param code 上一步加载好的原始代码
   * @param id 绝对路径
   * @param options 参数
   * @returns 转换完成的代码
   */
  transform(code: string, id: string, options?: {}): Promise<SourceDescription>
}

/**
 * 插件插件容器
 * @param config 配置对象
 * @returns 插件容器
 */
export function createPluginContainer(config: ResolvedConfig) {
  const { plugins } = config
  const { getSortedPlugins } = createPluginHookUtils(plugins)

  const container: PluginContainer = {
    async resolveId(rawId, importer, options) {
      const partial: PartialResolvedId = { id: '' }

      for (const p of getSortedPlugins('resolveId')) {
        if (!p.resolveId) continue

        const handler = isObject(p.resolveId)
          ? p.resolveId.handler
          : p.resolveId

        const result = await handler(rawId, importer, options)

        if (!result) continue

        if (isString(result)) {
          partial.id = result
        } else {
          partial.id = result.id
        }

        break
      }

      if (partial.id) {
        return partial
      }

      return null
    },

    async load(id, options) {
      for (const p of getSortedPlugins('load')) {
        if (!p.load) continue

        const handler = isObject(p.load) ? p.load.handler : p.load

        const result = await handler(id, options)
        if (result) {
          return result
        }
      }

      return null
    },

    async transform(code, id, options) {
      for (const p of getSortedPlugins('transform')) {
        if (!p.transform) continue

        const handler = isObject(p.transform)
          ? p.transform.handler
          : p.transform

        const result = await handler(code, id, options)

        if (!result) continue

        if (isObject(result)) {
          code = result.code || code
        } else {
          code = result
        }
      }

      return {
        code,
      }
    },
  }

  return container
}
