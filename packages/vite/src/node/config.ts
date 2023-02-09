import { writeFileSync } from 'fs'
import { readFile } from 'fs/promises'
import { createRequire } from 'module'
import path from 'path'
import { pathToFileURL } from 'url'

import { build } from 'esbuild'

import { DEFAULT_CONFIG_FILES } from './constants'
import { getSortedPluginsByHook } from './plugin'
import { resolvePlugins } from './plugins'
import {
  asyncFlatten,
  dirname,
  dynamicImport,
  existsSync,
  isAbsolute,
  isArray,
  isBuiltin,
  isFunction,
  isObject,
  lookupFile,
  mergeConfig,
  normalizePath,
  resolve,
  unlinkSync,
} from './utils'

import type { Plugin } from './plugin'

/**
 * 执行命令
 */
export type Command = 'serve' | 'build'

/**
 * 配置文件导出函数时的参数
 */
export interface ConfigEnv {
  /**
   * 运行命令
   * build: 生产环境打包
   * serve: 开发环境启动项目
   */
  // command: 'build' | 'serve'

  /**
   * 环境
   */
  mode: string
}

/**
 * 用户自定义配置
 */
export interface UserConfig {
  /**
   * 根路径
   *
   * @default process.cwd()
   */
  root?: string

  /**
   * 公共基础路径
   * 适用于 JS 引入的资源，CSS 中 url 引入的资源以及 .html 中引用的资源
   *
   * @default '/'
   */
  base?: string

  /**
   * 环境变量目录，相对路径是基于 root 的，没有传递就是 root
   */
  envDir?: string

  /**
   * 运行模式
   *
   * @default 'development'
   */
  mode?: string
}

/**
 * 用户自定义命令行配置
 */
export interface InlineConfig extends UserConfig {
  /**
   * 配置文件路径
   */
  configFile?: string | false

  /**
   * 插件列表
   */
  plugins?: PluginOption[]
}

/**
 * 解析完成后的配置
 */
export type ResolvedConfig = Omit<UserConfig, 'root' | 'base' | 'plugins'> & {
  root: string
  base: string
  plugins: Plugin[]
}

/**
 * 用户自定义导出函数配置
 */
export type UserConfigFn = (env: ConfigEnv) => UserConfig | Promise<UserConfig>

/**
 * 用户自定义导出配置
 */
export type UserConfigExport = UserConfig | Promise<UserConfig> | UserConfigFn

/**
 * 用户自定义插件配置，可多层嵌套
 */
export type PluginOption =
  | Plugin
  | null
  | undefined
  | false
  | PluginOption[]
  | Promise<Plugin | null | undefined | false | PluginOption[]>

/**
 * 异步打平后的自定义插件配置
 */
export type FlatPluginOption = Plugin | null | undefined | false

export async function resolveConfig(
  inlineConfig: InlineConfig,
  command: Command,
  defaultMode = 'development'
): Promise<ResolvedConfig> {
  let config = inlineConfig
  let { configFile, mode = defaultMode } = inlineConfig

  // console.log('inline config: ', inlineConfig)

  const resolvedRoot = normalizePath(
    config.root ? resolve(config.root) : process.cwd()
  )

  // configEnv 中 mode 的优先级：inline > default
  const configEnv: ConfigEnv = {
    mode,
  }

  // 没有禁止配置文件，则加载配置文件
  if (configFile !== false) {
    const loadResult = await loadConfigFromFile(
      configEnv,
      configFile,
      resolvedRoot
    )
    if (loadResult) {
      // 配置文件加载成功，覆盖配置对象 config，以及配置文件绝对路径 configFile
      config = loadResult.config
      configFile = loadResult.path
      // console.log('config file: ', config)
    }
  }

  // 重置 mode 的优先级：inline > config > default
  config.mode =
    configEnv.mode =
    mode =
      inlineConfig.mode || config.mode || defaultMode

  // 打平自定义插件列表，并过滤不需要执行的插件
  const rawUserPlugins = isArray(config.plugins)
    ? (
        await asyncFlatten<PluginOption, FlatPluginOption>(config.plugins)
      ).filter<Plugin>(filterPlugin)
    : []

  // 按照执行时机排序插件
  const [prePlugins, normalPlugins, postPlugins] =
    sortUserPlugins(rawUserPlugins)

  // 执行自定义插件的 config hook
  config = await runConfigHooks(
    [...prePlugins, ...normalPlugins, ...postPlugins],
    config,
    configEnv
  )

  // console.log('after config hooks: ', config)

  // // 解析环境变量所在目录
  // const resolvedEnvDir = config.envDir
  //   ? resolve(resolvedRoot, config.envDir)
  //   : resolvedRoot

  const resolved: ResolvedConfig = {
    base: resolveBaseUrl(config.base),
    root: resolvedRoot,
    plugins: await resolvePlugins(prePlugins, normalPlugins, postPlugins),
  }

  function filterPlugin(plugin: FlatPluginOption): plugin is Plugin {
    if (!plugin) {
      return false
    }
    if (!plugin.apply) {
      return true
    }
    if (isFunction(plugin.apply)) {
      return plugin.apply(config, configEnv)
    }
    return plugin.apply === command
  }

  return {
    ...config,
    ...resolved,
  }
}

/**
 * 从配置文件中加载配置
 * @param configFile 配置文件，可为空
 * @param configRoot 配置文件所在目录
 * @returns
 *  null - 没有可匹配到的配置文件
 *  object.path: 格式化好的配置文件绝对路径
 *  object.config: 最终的配置对象
 */
export async function loadConfigFromFile(
  configEnv: ConfigEnv,
  configFile?: string,
  configRoot: string = process.cwd()
): Promise<{
  path: string
  config: UserConfig
} | null> {
  let resolvedPath: string | undefined

  // 确定配置文件的绝对路径
  // 如果指定了配置文件，则将其转换为绝对路径
  // 否则依次检查配置文件名称列表，检查是否存在指定文件
  if (configFile) {
    resolvedPath = resolve(configFile)
  } else {
    let filePath: string | undefined
    for (const fileName of DEFAULT_CONFIG_FILES) {
      if (existsSync((filePath = resolve(configRoot, fileName)))) {
        resolvedPath = filePath
        break
      }
    }
  }

  // 如果都没有，则返回 null 表示没有配置文件
  if (!resolvedPath) {
    return null
  }

  // 检测是否是 ESM 环境，要么是 mjs 或 mts 文件，要么 package.json 的 type 是 module
  let isESM = false
  if (/\.m[jt]s$/.test(resolvedPath)) {
    isESM = true
  } else {
    const pkgContent = lookupFile(dirname(resolvedPath), ['package.json'], {
      pathOnly: false,
    })
    if (pkgContent) {
      JSON.parse(pkgContent).type === 'module' && (isESM = true)
    }
  }

  // 打包配置文件
  const bundled = await bundleConfigFile(resolvedPath, isESM)

  // 加载配置
  const userConfig = await loadConfigFromBundledFile(
    resolvedPath,
    bundled.code,
    isESM
  )

  const config: UserConfig = await (isFunction(userConfig)
    ? userConfig(configEnv)
    : userConfig)

  if (!isObject(config)) {
    throw new Error('config must export or return object.')
  }

  return {
    path: normalizePath(resolvedPath),
    config,
  }
}

/**
 * 使用 esbuild 打包配置文件
 * @param fileName 配置文件绝对路径
 * @param isESM 配置文件是否是 esm
 * @returns
 *  object.code 打包后的 js 代码
 *  object.dependencies 配置文件中的依赖文件列表
 */
async function bundleConfigFile(fileName: string, isESM: boolean) {
  const fileNameVar = '__vite_injected_original_dirname'
  const dirNameVar = '__vite_injected_original_filename'
  const importMetaUrlVar = '__vite_injected_original_import_meta_url'

  // 使用 esbuild 进行打包
  const result = await build({
    // absWorkingDir: process.cwd(),
    entryPoints: [fileName],
    // 设置打包输出的文件名，仅适用于一个入口的情况，多个入口配置 outdir
    // outdir: path.resolve(process.cwd(), 'out'),
    outfile: path.resolve(process.cwd(), 'output.js'),
    // 是否将输出内容写入文件系统，写入目录为 outfile 或 outdir 配置的地方
    write: false,
    // 输出代码需要在哪个环境运行
    // 例如配置 node，那么在处理 fs，path 等模块时会被视为内置模块；如果配置 browser，那么这些模块会报错
    platform: 'node',
    // 将依赖文件内联到输出文件中
    bundle: true,
    // mainFields: ['main'],
    metafile: true,
    // target: ['node14.18', 'node16'],
    // 输出代码模块类型
    format: isESM ? 'esm' : 'cjs',
    // 注入 cjs 全局变量名称
    define: {
      __filename: fileNameVar,
      __dirname: dirNameVar,
      'import.meta.url': importMetaUrlVar,
    },
    plugins: [
      // 处理第三方依赖的插件
      {
        name: 'externalize-deps',
        setup(build) {
          build.onResolve(
            { filter: /^[^.].*/ },
            async ({ path: id, importer, kind }) => {
              // 入口文件，内置模块以及绝对路径是不需要处理的
              if (kind === 'entry-point' || isBuiltin(id) || isAbsolute(id)) {
                return
              }
              return undefined
            }
          )
        },
      },
      // 注入 cjs 全局变量插件
      {
        name: 'inject-file-scope-variables',
        setup(build) {
          build.onLoad({ filter: /\.[cm]?[jt]s/ }, async ({ path: id }) => {
            const content = await readFile(id, 'utf-8')
            const injectCode = `
              // 模拟 __filename 变量
              const ${fileNameVar} = ${JSON.stringify(id)}
              // 模拟 __dirname 变量
              const ${dirNameVar} = ${JSON.stringify(path.dirname(id))}
              // 模拟 import.meta.url 变量
              const ${importMetaUrlVar} = ${JSON.stringify(pathToFileURL(id))}
            `.trim()

            return {
              loader: id.endsWith('ts') ? 'ts' : 'js',
              contents: injectCode + '\n' + content,
            }
          })
        },
      },
    ],
  })

  const {
    outputFiles: [{ text }],
    metafile: { inputs },
  } = result

  return {
    code: text,
    dependencies: Object.keys(inputs),
  }
}

const _require = createRequire(import.meta.url)

/**
 * 加载配置文件打包后的代码
 * @param resolvePath 配置文件绝对路径
 * @param code 配置文件打包后的代码
 * @param isESM 配置文件是否是 ESM 环境
 * @returns 配置文件导出内容
 */
async function loadConfigFromBundledFile(
  resolvePath: string,
  code: string,
  isESM: boolean
): Promise<UserConfigExport> {
  if (isESM) {
    // esm 采用动态 import 方式导入
    // 创建临时文件，将打包后的代码写入，并 import 进来，最后删除临时文件
    const tempFileBase = `${resolvePath}.timestamp-${Date.now()}`
    const tempFile = `${tempFileBase}.mjs`
    const tempFileUrl = `${pathToFileURL(tempFile)}`
    writeFileSync(tempFile, code)
    try {
      return (await dynamicImport(tempFileUrl)).default
    } finally {
      unlinkSync(tempFile)
    }
  } else {
    // cjs 使用 require 导入
    const res = _require(resolvePath)
    // 如果是 esm 打包的产物，那么返回 default 默认导出
    return res.__esModule ? res.default : res
  }
}

/**
 * 对自定义的插件按照 enforce 进行排序
 * @param plugins 插件列表
 * @returns
 */
function sortUserPlugins(plugins: Plugin[]): [Plugin[], Plugin[], Plugin[]] {
  const prePlugins: Plugin[] = []
  const normalPlugins: Plugin[] = []
  const postPlugins: Plugin[] = []

  for (const plugin of plugins) {
    if (plugin.enforce === 'post') postPlugins.push(plugin)
    else if (plugin.enforce === 'pre') prePlugins.push(plugin)
    else normalPlugins.push(plugin)
  }

  return [prePlugins, normalPlugins, postPlugins]
}

/**
 * 运行 config hooks
 * @param plugins 插件列表
 * @param config 自定义配置
 * @param configEnv 配置环境参数
 * @returns 执行 config hook 后合并的配置
 */
async function runConfigHooks(
  plugins: Plugin[],
  config: UserConfig,
  configEnv: ConfigEnv
) {
  for (const p of getSortedPluginsByHook('config', plugins)) {
    if (p.config) {
      const hook = isFunction(p.config) ? p.config : p.config.handler
      const hookConfig = await hook(config, configEnv)
      if (hookConfig) {
        config = mergeConfig(config, hookConfig)
      }
    }
  }

  return config
}

function resolveBaseUrl(base?: string) {
  return base || '/'
}
