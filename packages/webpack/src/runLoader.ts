import { isFunction, isPromise, isString, readFile } from './utils'

import type {
  RunLoaderCallbackResult,
  WebpackConfigLoader,
  WebpackConfigSingleLoader,
  WebpackLoaderContext,
  WebpackLoaderObject,
} from './typings'

export interface RunLoaderOptions {
  /**
   * 资源绝对路径
   */
  resourcePath: string

  /**
   * loader 列表
   */
  loaders: WebpackConfigLoader
}

export type CallbackWithArgs = (e: Error | null, ...args: unknown[]) => void

/**
 * 执行 loaders
 * @param options
 * @param callback
 */
export function runLoaders(
  options: RunLoaderOptions,
  callback: (e: Error | null, result: RunLoaderCallbackResult) => void
) {
  const { resourcePath, loaders } = options

  // 创建 laoderContext
  const loaderContext: WebpackLoaderContext = {
    resourcePath,
    loaderIndex: 0,
    loaders: loaders.map(createLoaderObject),
    callback: null!,
    async: null!,
  }

  // 从 pitch 阶段开始
  iteratePitchingLoaders(loaderContext, (e, ...args) => {
    if (e) {
      callback(e, {})
    } else {
      callback(null, { code: args[0] as string })
    }
  })
}

/**
 * 执行 pitch 阶段的 loader
 * @param loaderContext 上下文
 * @param callback 执行完成的回调
 * @returns
 */
function iteratePitchingLoaders(
  loaderContext: WebpackLoaderContext,
  callback: CallbackWithArgs
) {
  // 如果当前已经执行完所有的 pitch loader，则开始执行 normal 阶段
  if (loaderContext.loaderIndex >= loaderContext.loaders.length) {
    processResource(loaderContext, callback)
    return
  }

  // 当前需要执行的 loader
  const currentLoaderObject = loaderContext.loaders[loaderContext.loaderIndex++]
  // 加载 loader
  loadLoader(currentLoaderObject, () => {
    // 检测是否有 pitch 阶段，有则执行
    const pitch = currentLoaderObject.pitch
    if (isFunction(pitch)) {
      // 执行 loader 的 pitch 阶段
      runSyncOrAsync(pitch, loaderContext, [], (err, ...args) => {
        if (err) {
          callback(err)
        } else {
          if (args.length) {
            // pitch 有返回值，索引 - 1，直接开始执行 normal 阶段，此时将 pitch 的返回值作为 normal loader 的参数
            loaderContext.loaderIndex--
            iterateNormalLoaders(loaderContext, args, callback)
          } else {
            // pitch 没有返回值，继续执行下一个 loader 的 pitch
            iteratePitchingLoaders(loaderContext, callback)
          }
        }
      })
      return
    }

    // 没有 pitch 则执行下一个 loader 的 pitch
    iteratePitchingLoaders(loaderContext, callback)
  })
}

/**
 * 执行 normal 阶段的 loader
 * @param loaderContext 上下文
 * @param args loader 的参数
 * @param callback 执行完成的回调
 * @returns
 */
function iterateNormalLoaders(
  loaderContext: WebpackLoaderContext,
  args: unknown[],
  callback: CallbackWithArgs
) {
  // 检测所有 normal 阶段的 loader 是否执行完成
  if (loaderContext.loaderIndex <= 0) {
    return callback(null, ...args)
  }

  // 获取当前需要执行的 loader
  const currentLoaderObject = loaderContext.loaders[--loaderContext.loaderIndex]

  // 检测 normal 阶段的 loader 是否存在
  const normal = currentLoaderObject.normal
  if (isFunction(normal)) {
    // 调用 normal 阶段的 loaders
    runSyncOrAsync(normal, loaderContext, args, (err, ...args) => {
      if (err) {
        callback(err)
      } else {
        iterateNormalLoaders(loaderContext, args, callback)
      }
    })
    return
  }

  // 没有则执行下一个 loader
  iterateNormalLoaders(loaderContext, args, callback)
}

/**
 * 开始读取资源内容, 准备执行 normal loader
 * @param loaderContext 上下文
 * @param callback 完成回调
 */
function processResource(
  loaderContext: WebpackLoaderContext,
  callback: CallbackWithArgs
) {
  //  读取资源文件内容
  try {
    const content = readFile(loaderContext.resourcePath)
    iterateNormalLoaders(loaderContext, [content], callback)
  } catch (e) {
    callback(e as Error)
  }
}

/**
 * 加载 loader 内容
 * @param loaderObject loader 对象
 * @param callback 加载完成的回调
 */
function loadLoader(
  loaderObject: WebpackLoaderObject,
  callback: (err: Error | null) => void
) {
  try {
    const module = require(loaderObject.path)
    loaderObject.normal = module
    loaderObject.pitch = module.pitch
    callback(null)
  } catch (e) {
    callback(new Error(e as any))
  }
}

/**
 * 执行 fn 函数
 * @param fn 待执行的函数
 * @param context
 * @param args 参数
 * @param callback
 */
function runSyncOrAsync(
  fn: Function,
  context: WebpackLoaderContext,
  args: unknown[],
  callback: (err: Error | null, ...args: unknown[]) => void
) {
  let isSync = true

  context.async = () => {
    isSync = false
    return context.callback
  }

  context.callback = (e, content) => {
    isSync = false
    callback(e, content)
  }

  try {
    const result = fn.apply(context, args)
    if (isSync) {
      if (isPromise(result)) {
        result
          .then(data => {
            callback(null, data)
          })
          .catch(callback)
        return
      }
      callback(null, result)
    }
  } catch (e) {
    callback(e as Error)
  }
}

/**
 * 根据 loader 创建 loader 对象
 * @param loader loader 名称
 * @returns
 */
function createLoaderObject(loader: WebpackConfigSingleLoader) {
  const isStringLoader = isString(loader)
  const loaderObject: WebpackLoaderObject = {
    path: isStringLoader ? loader : loader.loader,

    options: isStringLoader ? undefined : loader.options,
  }

  return loaderObject
}
