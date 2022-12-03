import {
  effect,
  isReactive,
  isRef,
  isShallow,
  pauseTracking,
  resetTracking,
} from '@vue/reactivity'
import {
  NOOP,
  hasChanged,
  isArray,
  isFunction,
  isMap,
  isObject,
  isSet,
  isPlainObject,
  isString,
} from '@vue/shared'

import { getCurrentInstance } from './component'
import { ErrorCodes, callWithErrorHandling } from './errorHandling'
import { queueJob, queuePostFlushCb } from './scheduler'
import { warn } from './warning'

import type { ComponentInternalInstance } from './component'
import type { ComponentPublicInstance } from './componentPublicInstance'
import type { SchedulerJob } from './scheduler'
import type { DebuggerEvent, EffectScheduler, Ref } from '@vue/reactivity'

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

export type WatchCallback<T = any> = (
  newValue: T,
  oldValue: T | undefined,
  onCleanup: OnCleanup
) => void

// watch immediate 初始值，用于判断，不用做实际传递
const INITIAL_WATCHER_VALUE = Object.create(null)

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

export function watchPostEffect(
  callback: (cb: OnCleanup) => void,
  options: WatchEffectOptions = {}
) {
  return watchEffect(callback, { ...options, flush: 'post' })
}

export function watchSyncEffect(
  callback: (cb: OnCleanup) => void,
  options: WatchEffectOptions = {}
) {
  return watchEffect(callback, { ...options, flush: 'sync' })
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
    lastCleanupFn = () => {
      callWithErrorHandling(onCleanupFn, ErrorCodes.WATCH_CLEANUP)
    }
  }

  // effect 的调度任务，当监听的值变化，引起 effect 调度时执行
  const job: SchedulerJob = () => {
    if (!_effect.effect.active) {
      return
    }

    // 每次变化首先调用清除副作用的函数
    lastCleanupFn?.()

    if (callback === null) {
      // watchEffect
      // 直接调用 source
      _effect.effect.run()
      // ;(source as WatchEffectSource)(cleanup)
    } else {
      // watch
      // 调用 effect 的原始函数获取最新值
      const value = _effect.effect.run()

      // 以下情况会调用回调
      // 1. 深度监听，此时不需要检测新旧值，也无法检测，一旦修改，可以直接触发，如果修改的值没有发生变化，在 setter 中就会被过滤，不会走到这里
      // 2. 强制监听
      // 3. 数据源为数组：数组中的值发生变化
      // 4. 数据源不会数组：数据发生变化
      if (
        deep ||
        forceTrigger ||
        (multiplySource
          ? isArray(oldValue)
            ? value.some(hasChangedArrayItem)
            : true
          : hasChanged(oldValue, value))
      ) {
        callWithErrorHandling(callback, ErrorCodes.WATCH_CALLBACK, [
          value,
          oldValue === INITIAL_WATCHER_VALUE ? undefined : oldValue,
          cleanup,
        ])
        oldValue = value
      }
    }
  }

  // effect 原始函数，会在 effect 中执行，追踪其中访问的属性
  let getter: () => any

  if (isRef(source)) {
    // source 为 ref 对象
    // source 为 shallow，如果 shallow 的是一个对象，此时 oldValue 和 value 都是对象，无法检测是否发生变化，所以需要开启强制更新，无论有没有发生变化都会触发
    forceTrigger = isShallow(source)
    // 原始函数直接获取 .value，这样可以直接追踪 value
    getter = () => source.value
  } else if (isReactive(source)) {
    // source 为 reactive 响应对象
    // 使得每一个属性都会追踪到 effect
    forceTrigger = isShallow(source)
    // 响应式对象会自动进行深度追踪，标识深度追踪的开关
    deep = true
    // 原始函数直接返回响应式对象，此时不知道用户会访问哪一个属性，所以没办法追任何属性
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
          return callWithErrorHandling(item, ErrorCodes.WATCH_GETTER)
        } else {
          warn('Invalid watch source: ', item)
        }
      }) as any
  } else if (isFunction(source)) {
    if (callback === null) {
      // watchEffect，原始函数直接调用 source，追踪其中访问的属性
      getter = () =>
        callWithErrorHandling(source, ErrorCodes.WATCH_CALLBACK, [cleanup])
    } else {
      // watch，原始函数直接调用 source，追踪其中访问的属性，将返回值作为 value
      getter = () => callWithErrorHandling(source, ErrorCodes.WATCH_GETTER)
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

  // 第一次获取旧值，watchEffect 不需要旧值，watch 会根据 immediate 来决定
  // 如果需要立即执行，无论 source 是什么类型，都是 INITIAL_WATCHER_VALUE，在 job 中会判断
  // 如果是 INITIAL_WATCHER_VALUE 则传递的 oldValue 就是 undefined
  // 如果不需要立即执行，则调用 getter 获取，此时不会追踪任何属性
  // 如果 watch 在某个子组件内，那此时获取初始值可能会被父组件追踪，所以这里会暂停追踪依赖
  // watch 观察的依赖应该只能被自身创建的 effect 收集，不能被其他 effect 收集
  pauseTracking()
  let oldValue: T | undefined =
    callback === null ? undefined : immediate ? INITIAL_WATCHER_VALUE : getter()
  resetTracking()

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

  // 创建 effect，不立即执行 getter
  const _effect = effect<T>(getter, {
    scheduler,
    onTrack,
    onTrigger,
    lazy: true,
  })

  // 向当前实例中注入 watch 的 effect
  const instance = getCurrentInstance()
  if (instance) {
    ;(instance.effects ||= []).push(_effect.effect)
  }

  if (callback) {
    // watch api
    if (immediate) {
      job()
    } else {
      _effect.effect.run()
    }
  } else if (flush === 'post') {
    // watchEffect api
    // 渲染完成后执行，将 getter 放入 post 队列等待执行，这样 callback 会在异步队列中等待执行
    queuePostFlushCb(() => {
      _effect.effect.run()
    })
  } else {
    // watchEffect api
    // 立即执行 getter，从而同步执行 callback
    _effect.effect.run()
  }

  /**
   * 停止监听
   */
  const stop: StopHandle = () => {
    lastCleanupFn?.()
    _effect.effect.stop()
  }

  return stop
}

/**
 * this.$watch
 * @param instance
 * @returns
 */
export function watchInstance(
  instance: ComponentInternalInstance,
  source:
    | string
    | ((publicInstance: ComponentPublicInstance, ...args: unknown[]) => any),
  cb: WatchCallback,
  optinos: WatchOptions
) {
  const resolveSource = isString(source)
    ? createPathGetter(source, instance.proxy!)
    : (...args: any) => source(instance.proxy!, ...args)

  const stopHandle = watch(resolveSource, cb, optinos)

  return stopHandle
}

/**
 * 创建 watch 的链式访问函数
 * @param source
 * @param proxy
 * @returns
 */
export function createPathGetter(
  source: string,
  proxy: ComponentPublicInstance
) {
  const paths = source.split('.')

  return () => {
    let result

    for (let i = 0; i < paths.length; ++i) {
      result = (result || proxy)[paths[i]]
    }

    return result
  }
}
