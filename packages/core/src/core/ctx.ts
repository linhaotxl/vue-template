import { toArray } from '@antfu/utils'

import { presets } from '../presets'

import type { Import, Options } from '../types'

/**
 * 获取需要导入的成员列表
 * @param imports
 * @returns 由导入成员组成的 Import 列表
 */
export function flattenImports(
  imports: Options['imports'],
  overriding = false
) {
  const flat: Record<string, Import> = {}

  toArray(imports).forEach(definition => {
    // 处理字符串模块，直接从预设中获取需要导入的模块
    if (typeof definition === 'string') {
      if (!presets[definition]) {
        throw new Error(`[auto-import] preset ${definition} not found`)
      }
      const preset = presets[definition]
      definition = preset
    }

    // 遍历需要导入的模块，再次遍历每个模块需要导入的成员
    for (const [mod, members] of Object.entries(definition)) {
      for (const member of members) {
        const meta: Import = { from: mod, name: '', as: '' }

        // 处理需要重写本地名称的成员
        if (Array.isArray(member)) {
          meta.name = member[0]
          meta.as = member[1]
        } else {
          meta.name = meta.as = member
        }

        // 检测是否可以重写已经导入的成员
        if (flat[meta.name] && !overriding) {
          throw new Error(
            `[auto-import] identifier ${meta.name} already defined with ${meta.from}`
          )
        }

        flat[meta.name] = meta
      }
    }
  })

  return Object.values(flat)
}

export function createContext(options: Options = {}) {
  const imports = flattenImports(options.imports)
}
