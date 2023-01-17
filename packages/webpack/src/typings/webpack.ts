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
  extensions?: string[]
  entry: string | EntryObject
  plugins?: WebpackPlugin[]
  module?: WebpackConfigModule
  output: WebpackOutput
}

export interface WebpackResovleConfig extends WebpackUserConfig {
  context: string
  entry: EntryObject
  plugins: WebpackPlugin[]
  extensions: string[]
  module: Required<WebpackConfigModule>
}

export interface WebpackPlugin {
  apply(compiler: Compiler): void
}

export interface Chunk {
  /**
   * 代码块名称
   */
  name: string

  /**
   * 代码块入口模块
   */
  entryModule: FileModule

  /**
   * 代码块内的所有依赖模块
   */
  dependenceModules: FileModule[]
}
