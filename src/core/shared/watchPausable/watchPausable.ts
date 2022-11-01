import {} from 'vue'
import type {
  Ref,
  WatchCallback,
  WatchOptions,
  WatchSource,
  WatchStopHandle,
} from 'vue'
import type {
  ConfigurableEventFilter,
  MapSources,
  MultiWatchSources,
} from '../utils'
import { pausableFilter, bypassFilter } from '../utils'
import { watchWithFilter } from '../watchWithFilter'

export interface WatchPausableOptions<Immediate = boolean>
  extends ConfigurableEventFilter,
    WatchOptions<Immediate> {}

export interface WatchPausableReturn {
  /**
   * watch 的停止函数
   */
  stop: WatchStopHandle

  /**
   * 暂停 watch 的过滤器
   */
  resume: () => void

  /**
   * 恢复 watch 的过滤器
   */
  pause: () => void

  /**
   * 过滤器是否激活
   */
  isActive: Ref<boolean>
}

export function watchPausable<
  T extends MultiWatchSources,
  Immediate extends Readonly<boolean> = false
>(
  sources: [...T],
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchPausableOptions<Immediate>
): WatchPausableReturn

export function watchPausable<
  T extends Readonly<MultiWatchSources>,
  Immediate extends Readonly<boolean> = false
>(
  source: T,
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchPausableOptions<Immediate>
): WatchPausableReturn

export function watchPausable<T, Immediate extends Readonly<boolean> = false>(
  source: WatchSource<T>,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: WatchPausableOptions<Immediate>
): WatchPausableReturn

export function watchPausable<
  T extends object,
  Immediate extends Readonly<boolean> = false
>(
  source: T,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: WatchPausableOptions<Immediate>
): WatchPausableReturn

/**
 * 可控制 watch 的过滤器
 * @param source
 * @param cb
 * @param options
 * @returns
 */
export function watchPausable(
  source: any,
  cb: any,
  options: WatchPausableOptions = {}
): WatchPausableReturn {
  const { eventFilter: _eventFilter = bypassFilter, ...watchOptions } = options

  const { isActive, pause, resume, eventFilter } = pausableFilter(_eventFilter)
  const stop = watchWithFilter(source, cb, { ...watchOptions, eventFilter })

  return { stop, pause, resume, isActive }
}
