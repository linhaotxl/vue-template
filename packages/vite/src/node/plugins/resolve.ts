import { basename, dirname, join, normalizePath, statSync } from '../utils'

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
        // 尝试解析目录的下的 index 文件，具体是哪一个则由 extensions 配置的顺序决定
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
