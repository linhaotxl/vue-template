import { isPlainObject } from './../../shared/src/index'
import {
  DebuggerEvent,
  effect,
  EffectScheduler,
  isReactive,
  isRef,
  isShallow,
  Ref,
} from '@vue/reactivity'
import {
  isArray,
  isFunction,
  isMap,
  isObject,
  isSet,
  NOOP,
  hasChanged,
} from '@vue/shared'
import { queueJob, queuePostFlushCb, SchedulerJob } from './scheduler'
import { warn } from './warning'

export type StopHandle = () => void

export type WatchSource<T> = Ref<T> | (() => T)

export type WatchEffectSource = (cleanup: OnCleanup) => void
export type CleanupFn = () => void
export type OnCleanup = (cleanupFn: CleanupFn) => void

export interface WatchOptions {
  /**
   * 是否深度监听数据源变化
   *
   * @default false
   */
  deep?: boolean

  /**
   * 是否强制立即执行一次监听的回调
   *
   * @default false
   */
  immediate?: boolean

  /**
   * 数据源变化时，回调函数刷新的时机
   * @param sync 同步执行，数据源变化 -> effect 调度执行 === 回调函数执行
   * @param pre 异步执行，数据源变化 -> effect 调度执行，将回调放入微任务队列中，在组件更新之前执行，属于 pre 任务
   * @param post 异步执行，同上，在组件更新之后执行，属于 post 任务
   *
   * @default  'pre'
   */
  flush?: 'sync' | 'pre' | 'post'

  /**
   * 追踪属性触发的钩子
   */
  onTrack?: (event: DebuggerEvent) => void

  /**
   * 修改追踪的属性触发的钩子
   */
  onTrigger?: (event: DebuggerEvent) => void
}

export interface WatchEffectOptions {
  /**
   * 数据源变化时，回调函数刷新的时机
   *
   * @default  'pre'
   */
  flush?: 'sync' | 'pre' | 'post'

  /**
   * 追踪属性触发的钩子
   */
  onTrack?: (event: DebuggerEvent) => void

  /**
   * 修改追踪的属性触发的钩子
   */
  onTrigger?: (event: DebuggerEvent) => void
}

export type WatchCallback<T> = (
  newValue: T,
  oldValue: T | undefined,
  onCleanup: OnCleanup
) => void

/**
 * 监听单个数据源
 */
export function watch<T>(
  source: WatchSource<T>,
  callback: WatchCallback<T>,
  options?: WatchOptions
): StopHandle

/**
 * 监听多个数据源
 */
export function watch<T>(
  source: WatchSource<T[]>,
  callback: WatchCallback<T[]>,
  options?: WatchOptions
): StopHandle

export function watch<T>(
  source: WatchSource<T>,
  callback: WatchCallback<T>,
  options: WatchOptions = {}
) {
  return doWatch(source, callback, options)
}

export function watchEffect(
  callback: (cb: OnCleanup) => void,
  options: WatchEffectOptions = {}
) {
  return doWatch(callback, null, options)
}

/**
 * 递归遍历对象，数组，Map 和 Set，当需要深度监听时调用
 * 访问其中的每个值，确保每个值都追踪了 effect
 * @param obj
 * @returns
 */
function traverse<T>(obj: T) {
  if (!isObject(obj)) {
    return obj
  }

  if (isRef(obj)) {
    traverse(obj.value)
  } else if (isSet(obj)) {
    for (const item of obj.values()) {
      traverse(obj.has(item))
    }
  } else if (isMap(obj)) {
    for (const item of obj.keys()) {
      traverse(obj.get(item))
    }
  } else if (isArray(obj)) {
    for (let i = 0; i < obj.length; ++i) {
      traverse(obj[i])
    }
  } else if (isPlainObject(obj)) {
    for (const key in obj) {
      traverse(obj[key])
    }
  }

  return obj as T
}

/**
 * 实际监听的函数，用作 watch 和 watchEffect
 * @param source
 * @param callback
 * @param options
 * @returns
 */
function doWatch<T>(
  source: WatchSource<T> | WatchEffectSource,
  callback: WatchCallback<T> | null,
  { immediate, flush = 'pre', deep, onTrack, onTrigger }: WatchOptions = {}
) {
  if (callback === null) {
    // watchEffect
    if (typeof immediate === 'boolean') {
      warn(`"immediate" option is only respected`)
      immediate = false
    }

    if (typeof deep === 'boolean') {
      warn(`"deep" option is only respected`)
      deep = false
    }
  }

  let forceTrigger = false
  let multiplySource = false

  // 清除副作用的函数
  let lastCleanupFn: CleanupFn | null = null

  /**
   * 清除副作用，主要用于记录清除副作用的函数
   * @param onCleanupFn
   */
  const cleanup: OnCleanup = onCleanupFn => {
    lastCleanupFn = onCleanupFn
  }

  // effect 的调度任务，当监听的值变化，引起 effect 调度时执行
  const job: SchedulerJob = () => {
    // 每次变化首先调用清除副作用的函数
    lastCleanupFn?.()

    if (callback === null) {
      // watchEffect
      // 直接调用 source
      ;(source as WatchEffectSource)(cleanup)
    } else {
      // watch
      // 调用 effect 的回调获取最新值
      const value = _effect.effect.run()

      // 以下情况会调用回调
      // 1. 深度监听
      // 2. 强制监听
      // 3. 数据源为数组：数组中的值发生变化
      // 4. 数据源不会数组：数据发生变化
      if (
        deep ||
        forceTrigger ||
        (multiplySource
          ? immediate
            ? true
            : value.some(hasChangedArrayItem)
          : hasChanged(oldValue, value))
      ) {
        callback(value, oldValue, cleanup)
        oldValue = value
      }
    }
  }

  // getter 函数，会在 effect 中执行，所以会追踪其中访问的属性
  let getter: () => any

  if (isRef(source)) {
    // source 为 ref 则读取 value，当 value 变化时会引起 effect 调度
    forceTrigger = isShallow(source)
    getter = () => source.value
  } else if (isReactive(source)) {
    // source 为 reactive 则直接返回响应对象，在接来下会重写 getter 进行深度追踪，递归遍历对象里的每一个属性
    // 使得每一个属性都会追踪到 effect
    forceTrigger = isShallow(source)
    deep = true
    getter = () => source as T
  } else if (isArray(source)) {
    // source 为数组
    // 标识存在多个数据源
    multiplySource = true
    // 检查是否存在 reactive 相应对象，标识深度监听
    deep = source.some(isReactive)
    // 检查是否存在 shallow 响应对象，标识强制触发回调
    forceTrigger = source.some(isShallow)
    // 返回解析每个元素的值构成的新数组，注意这里使用 map 每次都会返回一个新的数组
    // 在接下来检测是否发生变化时只会检测数组的元素，而不会直接检测数组
    getter = () =>
      source.map(item => {
        if (isRef(item)) {
          return item.value
        } else if (isReactive(item)) {
          return item
        } else if (isFunction(item)) {
          return item()
        } else {
          warn('Invalid watch source: ', item)
        }
      }) as any
  } else if (isFunction(source)) {
    if (callback === null) {
      // watchEffect，将 job 作为 getter 在  effect 直接调用
      getter = job as any
    } else {
      // watch，source 为函数，继续使用这个函数作为 getter
      getter = source as () => T
    }
  } else {
    getter = NOOP as any
    warn('Invalid watch source: ', source)
  }

  // 深度监听，重写 getter，递归访问每一个属性，确保每一个属性都能追踪到 effect
  // 这样在之后无论修改多深层次的属性，都会引起 effect 的调度
  if (deep) {
    const baseGetter = getter!
    getter = () => traverse(baseGetter())
  }

  // 第一次获取旧值，如果需要立即执行回调则赋随机值对象，这样在接下来的比较中可以直接调用回调
  // 如果不需要立即执行回调，则调用 getter 获取初始值，这个时候并不会追踪 effect
  let oldValue: T | undefined =
    callback === null
      ? undefined
      : immediate
      ? multiplySource
        ? undefined
        : ({} as T)
      : getter()

  const hasChangedArrayItem = (item: any, i: number) =>
    hasChanged(item, (oldValue as any)[i])

  // effect 调度任务，决定执行时机
  let scheduler: EffectScheduler
  if (flush === 'sync') {
    scheduler = job as EffectScheduler
  } else if (flush === 'pre') {
    scheduler = () => {
      job.pre = true
      queueJob(job)
    }
  } else {
    scheduler = () => {
      queuePostFlushCb(job)
    }
  }

  // 创建 effect
  const _effect = effect<T>(getter, { scheduler, onTrack, onTrigger })

  /**
   * 停止监听
   */
  const stop: StopHandle = () => {
    lastCleanupFn?.()
    _effect.effect.stop()
  }

  if (immediate) {
    job()
  }

  return stop
}
