import fs from 'node:fs'
import { builtinModules } from 'node:module'
import { platform } from 'node:os'
import path from 'node:path'
import { URL } from 'node:url'

import { sync } from 'resolve'

import { DEFAULT_EXTENSIONS } from './constants'

import type { PathLike } from 'node:fs'

// 所有内置模块
const builtins = new Set<string>([
  ...builtinModules,
  'readline/promises',
  'wasi',
])

/**
 * 检测是否是内置模块
 * @param module
 * @returns
 */
export const isBuiltin = (module: string) =>
  builtins.has(module.replace(/^node:/, ''))

export const isWindows = platform() === 'win32'

/**
 * fs
 */

export const existsSync = (id: PathLike) => fs.existsSync(id)

export const writeFileSync = (...args: Parameters<typeof fs.writeFileSync>) =>
  fs.writeFileSync(...args)

export const unlinkSync = (...args: Parameters<typeof fs.unlinkSync>) =>
  fs.unlinkSync(...args)

export const statSync = (...args: Parameters<typeof fs.statSync>) =>
  fs.statSync(...args)

export const readFileSync = (file: string) => fs.readFileSync(file, 'utf-8')

/**
 * path
 */

export const isAbsolute = (id: string) => path.isAbsolute(id)

export const resolve = (...p: string[]) => path.resolve(...p)

export const dirname = (id: string) => path.dirname(id)
export const basename = (id: string) => path.basename(id)

export const join = (...args: Parameters<typeof path.join>) =>
  path.posix.join(...args)

export const normalizePath = (id: string) =>
  path.posix.normalize(isWindows ? slash(id) : id)

export const slash = (id: string) => id.replace(/\\/g, '/')

interface LoopupFileOptions {
  pathOnly?: boolean
}

/**
 * 查找指定文件路径或内容
 * @param dir 查找目录
 * @param fileNames 需要查找的文件名列表
 * @param options
 * @returns
 */
export function lookupFile(
  dir: string,
  fileNames: string[],
  options?: LoopupFileOptions
): string | undefined {
  // 遍历文件名列表，如果存在于 dir 下，根据 options 获取路径或内容
  for (const fileName of fileNames) {
    const fullPath = path.join(dir, fileName)
    if (existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      const result = options?.pathOnly
        ? fullPath
        : fs.readFileSync(fullPath, 'utf-8')

      return result
    }
  }

  // 如果 dir 下没有，则再向上查找，一直到根路径为止
  const parentDir = path.dirname(dir)
  if (parentDir !== dir) {
    return lookupFile(parentDir, fileNames, options)
  }
}

export const dynamicImport = new Function(`file`, 'return import(file)')

/**
 * value type check
 */

export const isFunction = (value: unknown): value is Function =>
  typeof value === 'function'

export const isString = (value: unknown): value is string =>
  typeof value === 'string'

export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean'

export const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

export const isPromise = <T>(value: unknown): value is Promise<T> =>
  isObject(value) && isFunction(value.then) && isFunction(value.catch)

export const isArray = Array.isArray

const importQueryRE = /[?&]import(?:&|$)/
export const isImportRequest = (url: string) => importQueryRE.test(url)

const knownJsSrcRE = /\.(?:[jt]sx?|m[jt]s)$/
export const isJSRequest = (url: string) => {
  url = clearUrl(url)

  if (knownJsSrcRE.test(url)) {
    return true
  }

  return false
}

/**
 * others
 */

/**
 * 异步方式打平数组，会等待数组中所有异步结束后，返回打平的数组
 * @param arr
 * @returns
 */
export const asyncFlatten = async <T, R extends T = T>(
  arr: T[]
): Promise<R[]> => {
  do {
    arr = (await Promise.all(arr)).flat(Infinity) as any
  } while (arr.some(isPromise))
  return arr as R[]
}

export function mergeConfig(
  defaults: Record<string, any>,
  overrides: Record<string, any>
): Record<string, any> {
  return { ...defaults, ...overrides }
}

export const queryRE = /\?.*$/
export const hashRE = /#.*$/

export const clearUrl = (url: string) =>
  url.replace(queryRE, '').replace(hashRE, '')

/**
 * 查找指定模块入口的绝对路径
 * @param id 模块
 * @param basedir 从指定目录开始查找
 * @returns
 */
export const resolveFrom = (id: string, basedir: string) =>
  sync(id, {
    basedir,
    preserveSymlinks: false,
    extensions: DEFAULT_EXTENSIONS,
  })

/**
 * 拼接两个 url
 * @param a
 * @param b
 */
export const joinUrlSegments = (a?: string, b?: string) => {
  if (!a || !b) {
    return a || b || ''
  }

  if (a.endsWith('/')) {
    a = a.substring(0, a.length - 1)
  }

  if (!b.startsWith('/')) {
    b = '/' + b
  }

  return a + b
}

/**
 * 注入搜索条件
 * @param url
 * @param query
 * @returns
 */
export const injectQuery = (url: string, query: string) => {
  const resolvedUrl = new URL(url, 'relative:///')
  const { search, hash, pathname } = resolvedUrl
  const resolvedQuery = search ? `${search}&${query}` : query ? `?${query}` : ''
  return `${pathname}${resolvedQuery}${hash}`
}

export const removeImportQuery = (url: string) => url.replace(importQueryRE, '')
