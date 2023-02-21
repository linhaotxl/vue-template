import { dirname, join, readFileSync, resolveFrom } from './utils'

/**
 * package.json 内容
 */
export interface PackageData {
  /**
   * package.json 文件所在目录
   */
  dir: string

  /**
   * package.json 文件内容
   */
  data: {
    name?: string
    version?: string
    type?: string
    main?: string
    module?: string
    exports?: PackageDataExports
    browser?: PackageDataBrowser
    [field: string]: any
  }
}

export type PackageDataBrowser = string | Record<string, string | false>

export type PackageDataExports = string | Record<string, string>

/**
 * 加载 package.json 文件内容
 * @param pkgPath
 */
export function loadPackageData(pkgPath: string) {
  const data = JSON.parse(readFileSync(pkgPath))
  const pkg: PackageData = {
    data,
    dir: dirname(pkgPath),
  }

  return pkg
}

/**
 * 解析 npm 包的 package.json 内容
 * @param id npm 包名
 * @param basedir 基于路径
 * @returns
 */
export function resolvePackageData(id: string, basedir: string) {
  try {
    const pkgPath = resolveFrom(join(id, 'package.json'), basedir)
    const pkg = loadPackageData(pkgPath)

    return pkg
  } catch (e) {
    // 如果找不到包，也不会报错，返回 null 即可
    if (e.code !== 'MODULE_NOT_FOUND') {
      throw e
    }
  }

  return null
}
