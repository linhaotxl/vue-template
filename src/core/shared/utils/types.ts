import type { WatchSource, WatchOptions } from 'vue'

export type Fn = () => void

export type MapSources<T, Immediate> = {
  [K in keyof T]: T[K] extends WatchSource<infer V>
    ? Immediate extends true
      ? V | undefined
      : V
    : T[K] extends object
    ? Immediate extends true
      ? T[K] | undefined
      : T[K]
    : never
}

export type MultiWatchSources = (WatchSource<unknown> | object)[]

const toString = Object.prototype.toString
export const toRawTypeString = (value: unknown) => toString.call(value)
export const toRawType = (value: unknown) => toRawTypeString(value).slice(8, -1)

export interface ConfigurableFlush {
  /**
   * 回调函数刷新时机
   *
   * @deafult 'pre'
   */
  flush?: WatchOptions['flush']
}
