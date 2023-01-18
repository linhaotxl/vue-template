import generate from '@babel/generator'
import { parse } from '@babel/parser'
import traverse from '@babel/traverse'
import types from '@babel/types'

import { tryResolve } from './resolver'
import {
  dirname,
  extractWebpackChunkName,
  normalizePath,
  readFile,
  relative4Root,
  toAbsolutePath,
} from './utils'

import type { Compilation } from './compilation'
import type { WebpackLoader } from './typings'
import type { Identifier, StringLiteral, Import } from '@babel/types'

let chunkCount = 0

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
  dependencies: { url: string; chunkId: string; async: boolean }[] = []

  /**
   * 模块所属的代码块
   */
  chunk: string

  /**
   * 是否是异步模块
   */
  async = false

  /**
   * 创建模块
   * @param moduleId 原始导入模块的名称
   * @param chunkName 代码块名
   * @param dir 父目录绝对路径
   */
  constructor(rawId: string, dir: string, chunkName: string) {
    this.file = normalizePath(toAbsolutePath(rawId, dir))
    this.id = `./${relative4Root(this.file)}`
    this.dir = dirname(this.file)
    this.sourceCode = readFile(this.file)
    this.chunk = chunkName
    // this.async = async
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
      CallExpression: (nodePath: any) => {
        const { node } = nodePath

        // 是否是 require 函数调用
        let isRequireFuncCall = false
        // 是否是 import 动态导入
        let isDynamicImport = false
        // 动态导入的 chunkName
        let chunkName = ''

        if (types.isIdentifier(node.callee) && node.callee.name === 'require') {
          // 处理 require 函数
          isRequireFuncCall = true
          // node.callee.name = '__webpack_require__'
        } else if (types.isImport(node.callee)) {
          // 处理 import 动态导入
          isDynamicImport = true

          // 在魔法注释中获取 chunkName，默认为数字
          const [rawId] = node.arguments
          if (types.isStringLiteral(rawId)) {
            chunkName =
              (rawId.leadingComments
                ? extractWebpackChunkName(rawId.leadingComments[0].value)
                : '') || `${chunkCount++}`
          }
        }

        if (isRequireFuncCall || isDynamicImport) {
          // 导入的模块名
          const depName = (node.arguments[0] as StringLiteral).value
          // 模块文件的绝对路径
          const depAbsolutePath = tryResolve(
            normalizePath(toAbsolutePath(depName, this.dir)),
            compilation.config.extensions
          )

          if (depAbsolutePath) {
            // 模块文件相对于根目录的路径
            const depRelative4Root = `./${relative4Root(depAbsolutePath)}`
            // 存入当前模块的依赖中
            this.dependencies.push({
              url: `./${relative4Root(depAbsolutePath, this.dir)}`,
              chunkId: isRequireFuncCall ? this.chunk : chunkName,
              async: isRequireFuncCall ? false : true,
            })

            if (isRequireFuncCall) {
              // 将 require 导入的路径重写为相对根目录的路径，也就是模块的 id 属性
              ;(node.callee as Identifier).name = '__webpack_require__'
              node.arguments = [types.stringLiteral(depRelative4Root)]
            } else {
              // 将 import() 重写
              nodePath.replaceWithSourceString(
                `__webpack_require__.e("${chunkName}").then(() => {
                  return __webpack_require__("${depRelative4Root}")
                })`
              )
            }
          }
        }
      },
    })

    // 编译每一个依赖文件
    this.dependencies.forEach(({ url, chunkId, async }) => {
      if (async) {
        compilation.createChunk(chunkId, url, this.dir, false)
      } else {
        compilation.createModule(url, this.dir, chunkId)
      }
    })

    // 生成改模块的代码，并记录
    // @ts-ignore
    const { code } = generate.default(ast)
    this.sourceCode = code
  }
}
