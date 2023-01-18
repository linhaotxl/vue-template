import type { Package } from './pkg'
import type { Compiler } from '../compiler'
import type { FileModule } from '../Module'

export type EntryObject = Record<string, string>

export type WebpackLoader = (code: string) => string

export interface WebpackRules {
  test: RegExp
  use: WebpackLoader[]
}

export interface WebpackConfigModule {
  rules?: WebpackRules[]
}

export interface WebpackOutput {
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
  output: WebpackOutput
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
