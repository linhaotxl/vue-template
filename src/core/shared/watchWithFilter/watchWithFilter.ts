import { WatchCallback, WatchOptions, WatchSource, WatchStopHandle } from 'vue'
import { watch } from 'vue'
import type {
  ConfigurableEventFilter,
  MultiWatchSources,
  MapSources,
} from '../utils'
import { createFilterWrapper, bypassFilter } from '../utils'

export interface WatchWithFilterOptions<Immediate = boolean>
  extends ConfigurableEventFilter,
    WatchOptions<Immediate> {}

export function watchWithFilter<
  T extends MultiWatchSources,
  Immediate extends Readonly<boolean> = false
>(
  sources: [...T],
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchWithFilterOptions<Immediate>
): WatchStopHandle

export function watchWithFilter<
  T extends Readonly<MultiWatchSources>,
  Immediate extends Readonly<boolean> = false
>(
  source: T,
  cb: WatchCallback<MapSources<T, false>, MapSources<T, Immediate>>,
  options?: WatchWithFilterOptions<Immediate>
): WatchStopHandle

export function watchWithFilter<T, Immediate extends Readonly<boolean> = false>(
  source: WatchSource<T>,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: WatchWithFilterOptions<Immediate>
): WatchStopHandle

export function watchWithFilter<
  T extends object,
  Immediate extends Readonly<boolean> = false
>(
  source: T,
  cb: WatchCallback<T, Immediate extends true ? T | undefined : T>,
  options?: WatchWithFilterOptions<Immediate>
): WatchStopHandle

/**
 * 带有过滤器的 watch
 * @param source
 * @param cb
 * @param options
 * @returns
 */
export function watchWithFilter(
  source: any,
  cb: any,
  options: WatchWithFilterOptions = {}
): WatchStopHandle {
  const { eventFilter = bypassFilter, ...watchOptions } = options

  return watch(source, createFilterWrapper(eventFilter, cb), watchOptions)
}
