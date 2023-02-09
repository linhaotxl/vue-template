import { isFunction, isObject } from './utils'

import type { ConfigEnv, UserConfig } from './config'
import type { IndexHtmlTransform } from './plugins/html'
import type {
  LoadResult,
  ObjectHook,
  Plugin as RollupPlugin,
  ResolveIdResult,
  SourceDescription,
  TransformResult,
} from 'rollup'

export interface Plugin extends RollupPlugin {
  /**
   * 插件执行时机
   */
  enforce?: 'pre' | 'post'

  /**
   * 插件适用于哪个命令下
   * 'serve': 适用于 serve 命令
   * 'build': 适用于 build 命令
   *
   */
  apply?: 'serve' | 'build' | ((config: UserConfig, env: ConfigEnv) => boolean)

  /**
   * 插件 config hook
   * 可以动态修改 config 配置，可以直接修改传入的 config，也可以返回部分 config，与已有的 config 进行深度合并
   */
  config?: ObjectHook<
    (
      config: UserConfig,
      configEnv: ConfigEnv
    ) => UserConfig | null | undefined | Promise<UserConfig | null | undefined>
  >

  /**
   * 转换 index.html 文件 hook
   */
  transformIndexHtml?: IndexHtmlTransform

  /**
   * 解析路径 hook
   */
  resolveId?: ObjectHook<
    (
      id: string,
      importer?: string,
      options?: {}
    ) => ResolveIdResult | Promise<ResolveIdResult>
  >

  /**
   * 加载解析好的文件内容
   */
  load?: ObjectHook<
    (id: string, options?: {}) => Promise<LoadResult> | LoadResult
  >

  /**
   * 转换加载好的的文件内容
   */
  transform?: ObjectHook<
    (
      code: string,
      id: string,
      options?: {}
    ) => Promise<TransformResult> | TransformResult
  >
}

type PluginHookName = keyof Plugin

/**
 * 获取排好序的插件 hook
 * @param hookName hook 名称
 * @param plugins 插件列表
 * @returns
 */
export function getSortedPluginsByHook(
  hookName: PluginHookName,
  plugins: Plugin[]
) {
  const prePlugins: Plugin[] = []
  const normalPlugins: Plugin[] = []
  const postPlugins: Plugin[] = []

  for (const plugin of plugins) {
    const hook = plugin[hookName]
    if (hook) {
      if (isObject(hook)) {
        if (hook.order === 'pre') {
          prePlugins.push(plugin)
          continue
        } else if (hook.order === 'post') {
          postPlugins.push(plugin)
          continue
        }
      }
      normalPlugins.push(plugin)
    }
  }

  return [...prePlugins, ...normalPlugins, ...postPlugins]
}

/**
 * 创建插件 hook 相关工具函数
 * @param plugins 插件列表
 * @returns
 */
export function createPluginHookUtils(plugins: Plugin[]) {
  const sortedPluginCache = new Map<PluginHookName, Plugin[]>()

  /**
   * 按照执行时机获取插件指定 hook 列表
   * @param hookName hook name
   * @returns
   */
  function getSortedPlugins(hookName: PluginHookName) {
    if (sortedPluginCache.has(hookName)) {
      return sortedPluginCache.get(hookName)!
    }

    const sortedPluginHooks = getSortedPluginsByHook(hookName, plugins)
    sortedPluginCache.set(hookName, sortedPluginHooks)
    return sortedPluginHooks
  }

  return {
    getSortedPlugins,
  }
}
