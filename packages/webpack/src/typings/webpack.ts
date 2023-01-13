import type { Compiler } from '../compiler'

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
  extensions?: string[]
  entry: string | EntryObject
  plugins?: WebpackPlugin[]
  module?: WebpackConfigModule
  output: WebpackOutput
}

export interface WebpackResovleConfig extends WebpackUserConfig {
  entry: EntryObject
  plugins: WebpackPlugin[]
  extensions: string[]
  module: Required<WebpackConfigModule>
}

export interface WebpackPlugin {
  apply(compiler: Compiler): void
}

export interface Module {
  /**
   * 模块相对于根目录的路径
   */
  id: string

  /**
   * 模块绝对路径
   */
  file: string

  /**
   * 模块对应的源码
   */
  sourceCode: string

  /**
   * 依赖的模块
   */
  dependencies: string[]

  /**
   * 此模块属于哪个代码块
   */
  chunks: string[]
}

export interface Chunk {
  /**
   * 代码块名称
   */
  name: string

  /**
   * 代码块入口模块
   */
  entryModule: Module

  /**
   * 代码块内的所有依赖模块
   */
  dependenceModules: Module[]
}
