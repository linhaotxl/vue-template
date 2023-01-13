import path from 'path'

import generate from '@babel/generator'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import types from '@babel/types'

import { generateChunkCode } from './generate'
import { tryResolve } from './resolver'
import { normalizePath, readFile, relative4Root, toAbsolutePath } from './utils'

import type {
  Chunk,
  Module,
  WebpackLoader,
  WebpackResovleConfig,
} from './typings'
import type { Identifier, StringLiteral } from '@babel/types'

export class Compilation {
  // 本次编译产生的所有模块
  private modules: Module[] = []
  // 本次编译产生的所有代码块
  private chunks: Chunk[] = []
  // 本次编译所产生的资源文件，文件名 -> 资源代码
  assets: Record<string, string> = {}

  constructor(private config: WebpackResovleConfig) {}

  /**
   * 开始编译项目
   */
  build() {
    // 从入口开始，依次编译所有文件
    const entry = this.config.entry
    for (const chunkName in entry) {
      // 入口文件绝对路径
      const entryModulePath = normalizePath(toAbsolutePath(entry[chunkName]))
      // 入口文件模块
      const entryModule = this.buildModule(chunkName, entryModulePath)
      // 代码块
      const chunk: Chunk = {
        name: chunkName,
        entryModule,
        // 过滤非本代码块的模块，以及入口模块自身
        dependenceModules: this.modules.filter(
          module =>
            module.chunks.includes(chunkName) &&
            module.file !== entryModule.file
        ),
      }
      this.chunks.push(chunk)
    }

    // 生成每个代码块的最终代码，记录在资源中
    this.chunks.forEach(chunk => {
      const chunkCode = generateChunkCode(chunk)
      this.assets[chunk.name] = chunkCode
    })
  }

  /**
   * 编译文件
   * @param chunkName 文件所在的代码块
   * @param modulePath 模块绝对路径
   * @returns
   */
  private buildModule(chunkName: string, modulePath: string) {
    // 创建对应的模块对象
    const module: Module = {
      id: `./${relative4Root(modulePath)}`,
      sourceCode: readFile(modulePath),
      dependencies: [],
      file: modulePath,
      chunks: [chunkName], // 默认属于 chunkName 代码块
    }
    this.modules.push(module)

    // 交由处理 loader 处理为 js
    const loaders: WebpackLoader[] = []
    for (const loader of this.config.module.rules) {
      if (loader.test.test(modulePath)) {
        loaders.push(...loader.use)
      }
    }
    module.sourceCode = loaders.reduceRight(
      (prev, loader) => loader(prev),
      module.sourceCode
    )

    // babel 处理依赖模块
    const ast = parse(module.sourceCode, { sourceType: 'module' })

    const dir = path.dirname(modulePath)

    // @ts-ignore
    traverse.default(ast, {
      CallExpression: ({ node }: any) => {
        // 只会处理 require 函数调用
        const functionName = (node.callee as Identifier).name
        if (functionName !== 'require') {
          return
        }

        // 依赖名
        const depName = (node.arguments[0] as StringLiteral).value
        // 依赖文件的绝对路径
        const depAbsolutePath = tryResolve(
          normalizePath(toAbsolutePath(depName, dir)),
          this.config.extensions
        )

        if (depAbsolutePath) {
          // 将 require 导入的依赖重写为相对根目录的路径
          const depRelative = `./${relative4Root(depAbsolutePath)}`
          module.dependencies.push(depAbsolutePath)
          node.arguments = [types.stringLiteral(depRelative)]
        }
      },
    })

    // 编译每一个依赖文件
    module.dependencies.forEach(modulePath => {
      this.buildModule(chunkName, modulePath)
    })

    // 生成改模块的代码，并记录
    // @ts-ignore
    const { code } = generate.default(ast)
    module.sourceCode = code

    return module
  }
}
