import { extname } from 'node:path'

import { hasESMSyntax } from 'mlly'
import { exports } from 'resolve.exports'

import { resolvePackageData } from '../packages'
import {
  basename,
  dirname,
  isObject,
  isString,
  join,
  normalizePath,
  readFileSync,
  statSync,
} from '../utils'

import type { PackageData } from '../packages'
import type { Plugin } from '../plugin'

/**
 * 解析路径参数
 */
export interface InternalResolveOptions {
  /**
   * 当解析的是一个目录时，是否尝试解析目录下的 index 或 package.json
   */
  tryIndex?: boolean

  /**
   * 当解析的是一个目录时，是否需要跳过解析目录下的 package.json
   */
  skipPackageJson?: boolean

  /**
   * 当解析的文件没有扩展名时，会尝试加入配置扩展名再次解析
   */
  extensions?: string[]

  /**
   * 如果文件/目录本身没有解析出结果，那么尝试在文件/目录名前加入前缀，对结果再次解析
   */
  tryPrefix?: string

  /**
   * 是否是生产环境
   */
  isProduction?: boolean

  /**
   * 解析入口时是否查找 cjs
   */
  isReauire?: boolean

  /**
   * 解析的路径是否在浏览器环境下可用
   */
  targetWeb?: boolean

  /**
   * 解析 exports 入口时额外的条件
   */
  conditions?: string[]

  /**
   * 解析入口时会按照配置的顺序检查是否存在指定字段，如果存在则将其作为入口
   */
  mainFields?: string[]
}

/**
 * 解析一个具体的文件（带扩展）或目录
 * @param fileOrDictionary 需要解析的路径
 * @param postfix 解析路径的后缀
 * @param options 解析参数
 * @returns 格式化好的文件绝对路径
 */
export function tryResolveFile(
  fileOrDictionary: string,
  postfix: string,
  options: InternalResolveOptions
) {
  // 检查文件或目录是否存在
  const stat = statSync(fileOrDictionary, { throwIfNoEntry: false })

  if (stat) {
    if (stat.isDirectory()) {
      // 解析的是目录
      if (options.tryIndex) {
        // 尝试解析 index，但是优先解析入口
        if (!options.skipPackageJson) {
          const pkg = resolvePackageData(fileOrDictionary, fileOrDictionary)
          if (pkg) {
            const entryPoint = resolvePackageEntry(
              fileOrDictionary,
              pkg,
              options
            )
            return entryPoint
          }
        }

        // 不解析入口，则尝试解析目录的下的 index 文件，具体是哪一个则由 extensions 配置的顺序决定
        // 如果能解析出 index 则需要加上后缀 postfix
        const index = tryFsResolve(join(fileOrDictionary, 'index'), options)
        if (index) return index + postfix
      }
    } else {
      // 解析的是文件，直接对其格式化并返回
      return getRealPath(fileOrDictionary) + postfix
    }
  }

  // 当 fileDictionary 不存在时，尝试加入前缀再次解析
  if (options.tryPrefix) {
    const resolved = tryFsResolve(
      join(
        dirname(fileOrDictionary),
        options.tryPrefix + basename(fileOrDictionary)
      ),
      { ...options, tryPrefix: undefined }
    )
    if (resolved) return resolved + postfix
  }
}

/**
 * 尝试解析一个路径，可能是目录，文件或者不带扩展的文件
 * @param id
 * @param options
 * @returns
 */
export function tryFsResolve(
  id: string,
  options: InternalResolveOptions
): string | undefined {
  let res: string | undefined = undefined

  // 首先直接使用 id 作为路径解析，可能路径中会存在 # 或者 ?
  // 分两步
  // 1. 直接解析 id
  // 2. 上一步无法解析，再拼接扩展名解析
  if ((res = tryResolveFile(id, '', options))) {
    return res
  }

  if (options.extensions) {
    for (const ext of options.extensions) {
      if ((res = tryResolveFile(`${id}${ext}`, '', options))) {
        return res
      }
    }
  }

  // 解析带有 ? 或 # 的路径失败，那么需要将参数分割开解析，分两步
  // 1. 直接解析 file
  // 2. 上一步无法解析，再拼接扩展名解析
  const { file, postfix } = splitFileAndPostfix(id)
  if ((res = tryResolveFile(file, postfix, options))) {
    return res
  }

  if (options.extensions) {
    for (const ext of options.extensions) {
      if ((res = tryResolveFile(`${file}${ext}`, postfix, options))) {
        return res
      }
    }
  }

  return res
}

/**
 * 获取格式化好的路径
 * @param file
 * @returns
 */
export function getRealPath(file: string) {
  return normalizePath(file)
}

/**
 * 分割路径的参数
 * @param id
 * @returns
 */
export function splitFileAndPostfix(id: string) {
  let file = id
  let postfix = ''
  let postfixIndex = -1

  if (
    (postfixIndex = id.lastIndexOf('?')) > 0 ||
    (postfixIndex = id.lastIndexOf('#')) > 0
  ) {
    postfix = id.slice(postfixIndex)
    file = id.slice(0, postfixIndex)
  }

  return { file, postfix }
}

/**
 * TODO: 解析 npm 包的 exports 入口
 * @param pkgData package.json 内容
 * @param key 需要解析 exports 的哪个入口
 * @param options 解析参数
 */
export function resolveExports(
  pkgData: PackageData['data'],
  key: string,
  options: InternalResolveOptions
) {
  const conditions = new Set<string>([...(options.conditions || [])])

  options.isProduction
    ? conditions.add('production')
    : conditions.add('development')

  options.targetWeb ? conditions.add('browser') : conditions.add('node')

  options.isReauire ? conditions.add('require') : conditions.add('import')

  const result = exports(pkgData, key, {
    conditions: [...conditions],
  })

  return result ? result[0] : undefined
}

/**
 * TODO: 解析 npm 的入口文件
 * @param id npm 包名
 * @param pkg npm 包对应的 package.json 内容
 * @param options 解析参数
 * @returns 入口文件路径
 */
export function resolvePackageEntry(
  id: string,
  pkg: PackageData,
  options: InternalResolveOptions
) {
  const { data, dir } = pkg
  const { exports, browser } = data
  let entryPoint: string | undefined

  // 1. 优先解析 exports 字段指向的入口
  if (exports) {
    entryPoint = resolveExports(data, '.', options)
  }

  // const browserIsObject = isObject(data.browser)

  // 2. web 环境下需要解析 browser 字段
  if (options.targetWeb && browser && !entryPoint) {
    // 获取 browser 字段的入口
    const browserEntry = isObject(browser) ? browser['.'] : browser

    if (browserEntry) {
      // 如果 browser 入口和 module 同时存在，并且指向不同文件，这是需要判断到底使用哪一个
      // 如果 browser 入口的文件使用 ESM 语法，那么将其视为入口，否则将 module 视为入口
      if (data.module && data.module !== browserEntry) {
        const browserEntryResolved = tryFsResolve(
          join(dir, browserEntry),
          options
        )
        if (browserEntryResolved) {
          const browserEntryCode = readFileSync(browserEntryResolved)
          const browserEntryHasESM = hasESMSyntax(browserEntryCode)
          if (browserEntryHasESM) {
            entryPoint = browserEntry
          } else {
            //
          }
        }
      } else {
        // entryPoint = browserEntry
      }
    }
  }

  // 3. 解析 mainFields 中的字段
  if (!entryPoint && options.mainFields) {
    for (const field of options.mainFields) {
      if (isString(data[field])) {
        entryPoint = data[field]
        break
      }
    }
  }

  // 使用 main 字段兜底
  entryPoint ||= data.main

  // 可能的入口文件列表，如果经历上面几个步骤还是没有解析出入口，则使用默认值
  const entryPointes = entryPoint ? [entryPoint] : ['index.js']

  // 遍历可能存在的入口，依次解析每一个，如果能解析到则直接返回，代表最终的入口
  for (let entry of entryPointes) {
    // 如果 browser 是对象，那么会检查 entry 是否能匹配上浏览器环境下重写的路径
    if (options.targetWeb && isObject(browser)) {
      const browserMap = mapWithBrowserField(
        entry,
        data.browser as Record<string, string | false>
      )
      if (browserMap) entry = browserMap
    }

    const entryPath = join(pkg.dir, entry)
    const entryResolved = tryFsResolve(entryPath, options)
    if (entryResolved) return entryResolved
  }

  // 解析不到入口则抛错
  throw new Error(`Failed to resolve entry for package "${id}".`)
}

/**
 * 匹配是否有对应的 browser 字段
 * @param relativePath
 * @param browser
 * @returns
 */
function mapWithBrowserField(
  relativePath: string,
  browser: Record<string, string | false>
) {
  const normalizeRelative = normalizePath(relativePath)

  for (const key in browser) {
    const normalizeKey = normalizePath(key)
    if (normalizeKey === normalizeRelative) {
      return browser[key]
    }
  }
}

/**
 * 提取可能存在的 id
 * @param id
 * @returns
 */
export function extractPossiableIds(id: string) {
  let prevSlash = -1
  const possiableIds: string[] = []

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let slashIndex = id.indexOf('/', prevSlash + 1)
    if (slashIndex < 0) {
      slashIndex = id.length
    }

    const part = id.slice(prevSlash + 1, slashIndex)
    if (!part) break

    prevSlash = slashIndex

    if (possiableIds.length ? extname(part) : part.startsWith('@')) {
      continue
    }

    const possiableId = id.slice(0, slashIndex)
    possiableIds.push(possiableId)
  }

  return possiableIds
}

export function resolvePlugin(): Plugin {
  return {
    name: 'vite:resolve',

    resolveId(id, importer, options) {},
  }
}
