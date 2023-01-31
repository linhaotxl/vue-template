import type { Package } from './pkg'
import type { Compiler } from '../compiler'

export type EntryObject = Record<string, string>

/**
 * Loader
 */
export interface WebpackPitchLoader {
  (this: WebpackLoaderContext): void
}

export interface WebpackNormalLoader {
  (this: WebpackLoaderContext, code: string): string
}

export interface WebpackLoader extends WebpackNormalLoader {
  pitch?: WebpackPitchLoader
}

export interface RunLoaderCallbackResult {
  code?: string
}

export interface WebpackLoaderObject {
  // raw: WebpackConfigSingleLoader

  /**
   * loader 的路径
   */
  path: string

  /**
   * normal 阶段的 loader
   */
  normal?: WebpackLoader

  /**
   * pitch 阶段的 loader
   */
  pitch?: () => void

  /**
   * normal 阶段的参数
   */
  options?: unknown
}

export interface WebpackLoaderContext {
  /**
   * loader 执行的索引
   */
  loaderIndex: number

  /**
   * 所有 loader 的对象列表
   */
  loaders: WebpackLoaderObject[]

  /**
   *
   */
  resourcePath: string

  callback: (e: Error, content: string | Buffer) => void

  async: () => WebpackLoaderContext['callback']
}

export interface WebpackConfigLoaderOptions {
  /**
   * loader 名称
   */
  loader: string

  /**
   * normal 阶段的参数
   */
  options?: unknown

  /**
   * loader 执行时机
   *
   * @default 'normal'
   */
  enforce?: 'pre' | 'normal' | 'post' | undefined
}

export type WebpackConfigSingleLoader = string | WebpackConfigLoaderOptions
export type WebpackConfigLoader = WebpackConfigSingleLoader[]

export interface WebpackConfigRule {
  /**
   * 校验文件类型
   */
  test: RegExp

  /**
   * loader 列表
   */
  use: string | WebpackConfigLoader
}

export interface WebpackConfigModule {
  rules?: WebpackConfigRule[]
}

export interface WebpackConfigOutput {
  path: string
  filename: string
}

export interface WebpackUserConfig {
  /**
   * @default process.cwd()
   *
   * 入口路径的上下文
   */
  context?: string

  /**
   * 文件扩展名
   *
   * @default ['.js']
   */
  extensions?: string[]

  /**
   * 入口
   */
  entry: string | EntryObject

  /**
   * 插件
   */
  plugins?: WebpackPlugin[]

  /**
   * 模块配置
   */
  module?: WebpackConfigModule

  /**
   * 输出配置
   */
  output: WebpackConfigOutput
}

export interface WebpackResovleConfig extends WebpackUserConfig {
  context: string
  entry: EntryObject
  plugins: WebpackPlugin[]
  extensions: string[]
  module: Required<WebpackConfigModule>
  pkg: Package
}

export interface WebpackPlugin {
  apply(compiler: Compiler): void
}
