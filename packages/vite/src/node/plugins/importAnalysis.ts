import { makeLegalIdentifier } from '@rollup/pluginutils'
import { parse as parseJS } from 'acorn'

import type { Node } from 'estree'

type ImportNameSpecifier = {
  importedName: string
  localName: string
}

export function transformCjsImport(
  importExp: string,
  url: string,
  rawUrl: string,
  importIndex: number
) {
  // 解析为 AST 节点
  const node = (
    parseJS(importExp, {
      ecmaVersion: 'latest',
      sourceType: 'module',
    }) as any
  ).body[0] as Node

  // 重写导入的变量
  const cjsModuleName = `__vite__cjsImport${importIndex}_${rawUrl}`
  // 需要从 module 中读取的变量名；const ${localName} = module[${importedName}]
  const importNames: ImportNameSpecifier[] = []
  // 保存命名导出的变量
  const exportNames: string[] = []
  // 默认导出的变量名
  let exportDefaultName: string | undefined

  // 只处理导入、命名导出语句
  // import * as A from 'xxx'
  // import A from 'xxx'
  // import { A } from 'xxx'
  // export { a }
  // export { a as default }
  if (
    node.type === 'ImportDeclaration' ||
    node.type === 'ExportNamedDeclaration'
  ) {
    for (const spec of node.specifiers) {
      if (spec.type === 'ImportSpecifier') {
        importNames.push({
          importedName: spec.imported.name,
          localName: spec.local.name,
        })
      } else if (spec.type === 'ImportDefaultSpecifier') {
        importNames.push({
          importedName: 'default',
          localName: spec.local.name,
        })
      } else if (spec.type === 'ImportNamespaceSpecifier') {
        importNames.push({ importedName: '*', localName: spec.local.name })
      } else if (spec.type === 'ExportSpecifier') {
        // 处理 export

        // 获取导入的变量名，即 export { useState as useStateAlias } from 'react' 中的 useState
        const localName = spec.local.name
        // 获取导出的变量名，即 export { useState as useStateAlias } from 'react' 中的 useStateAlias
        const exportedName = spec.exported.name

        if (exportedName === 'default') {
          // 默认导出 export { default as React } from 'react'
          // 标记默认导出的变量名，即 export default ${exportDefaultName}
          exportDefaultName = makeLegalIdentifier(
            `__vite__cjsExportDefault_${importIndex}`
          )
          // 加入导入的变量，以便能够从 module 中读取默认导出的变量
          importNames.push({
            importedName: localName,
            localName: exportDefaultName,
          })
        } else {
          // 命名导出，export { useState as useStateAlias } from 'react'
          // 标记导出变量在本地的名称
          const exportLocalName = makeLegalIdentifier(
            `__vite__cjsExport_${exportedName}`
          )
          // 记录在导入语句中，以便能够在 module 中读取
          importNames.push({
            importedName: localName,
            localName: exportLocalName,
          })
          // 同时也记录在导出语句中，__vite__cjsExport_useStateAlias as useStateAlias
          exportNames.push(`${exportLocalName} as ${exportedName}`)
        }
      }
    }

    // 所有语句集合，第一条是默认导入模块的语句
    const lines: string[] = [`import ${cjsModuleName} from "${url}"`]

    for (const i of importNames) {
      if (i.importedName === 'default') {
        // 默认导入，从 module 中读取默认导出的变量，需要兼容 cjs
        lines.push(
          `const ${i.localName} = ${cjsModuleName}.__esModule ? ${cjsModuleName}.default : ${cjsModuleName}`
        )
      } else if (i.importedName === '*') {
        // 命名空间导入，直接读取 module 变量作为导出变量
        lines.push(`const ${i.localName} = ${cjsModuleName}`)
      } else {
        // 命名导入，从 module 中读取对应的变量
        lines.push(
          `const ${i.localName} = ${cjsModuleName}["${i.importedName}"]`
        )
      }
    }

    // 如果存在默认导出的变量，则添加默认导出语句
    if (exportDefaultName) {
      lines.push(`export default ${exportDefaultName}`)
    }

    // 如果存在命名导出变量，则添加命名导出语句
    if (exportNames.length) {
      lines.push(`export { ${exportNames.join(', ')} }`)
    }

    return lines.join('; ')
  }
}
