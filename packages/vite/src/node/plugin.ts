import { isFunction, isObject } from './utils'

import type { ConfigEnv, UserConfig } from './config'
import type { IndexHtmlTransform } from './plugins/html'
import type { ObjectHook, Plugin as RollupPlugin } from 'rollup'

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
}

export function getSortedPluginsByHook(hookName: 'config', plugins: Plugin[]) {
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
