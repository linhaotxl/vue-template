import path from 'path'

import generate from '@babel/generator'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import types from '@babel/types'

import { tryResolve } from './resolver'
import { normalizePath, readFile, relative4Root, toAbsolutePath } from './utils'

import type { Compilation } from './compilation'
import type { WebpackLoader } from './typings'
import type { Identifier, StringLiteral } from '@babel/types'

export class FileModule {
  /**
   * 模块 id，是一个相对于根目录的路径
   */
  id: string

  /**
   * 模块绝对路径
   */
  file: string

  /**
   * 文件所属目录
   */
  dir: string

  /**
   * 模块源代码
   */
  sourceCode: string

  /**
   * 模块依赖的文件
   */
  dependencies: string[] = []

  /**
   * 模块所属的代码块
   */
  chunk: string

  /**
   * 创建模块
   * @param moduleId 原始导入模块的名称
   * @param chunkName 代码块名
   * @param dir 父目录绝对路径
   */
  constructor(rawId: string, dir: string, chunkName: string) {
    this.file = normalizePath(toAbsolutePath(rawId, dir))
    this.id = `./${relative4Root(this.file)}`
    this.dir = path.dirname(this.file)
    this.sourceCode = readFile(this.file)
    this.chunk = chunkName
  }

  /**
   * 编译模块
   * @param compilation
   */
  build(compilation: Compilation) {
    // 交由处理 loader 处理为 js
    const loaders: WebpackLoader[] = []
    for (const loader of compilation.config.module.rules) {
      if (loader.test.test(this.file)) {
        loaders.push(...loader.use)
      }
    }
    this.sourceCode = loaders.reduceRight(
      (prev, loader) => loader(prev),
      this.sourceCode
    )

    // babel 处理依赖模块
    const ast = parse(this.sourceCode, { sourceType: 'module' })

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
          normalizePath(toAbsolutePath(depName, this.dir)),
          compilation.config.extensions
        )

        if (depAbsolutePath) {
          // 这里需要将 require 导入的路径重写为相对根目录的路径，也就是模块的 id 属性
          const depRelative4Root = `./${relative4Root(depAbsolutePath)}`
          node.arguments = [types.stringLiteral(depRelative4Root)]
          this.dependencies.push(
            `./${relative4Root(depAbsolutePath, this.dir)}`
          )
        }
      },
    })

    // 编译每一个依赖文件
    this.dependencies.forEach(modulePath => {
      compilation.createModule(modulePath, this.dir, this.chunk)
    })

    // 生成改模块的代码，并记录
    // @ts-ignore
    const { code } = generate.default(ast)
    this.sourceCode = code
  }
}
