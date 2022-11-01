import type { ConfigurableEventFilter } from '../shared/utils/filter'
import type { Ref } from 'vue'
import { ref } from 'vue'
import type { ConfigurableFlush, MaybeRef } from '../shared'
import { resolveUnref, watchPausable } from '../shared'
import { useEventListener } from '../useEventListener'
import { guessType } from './guess'

export type PossibleStrType =
  | 'null'
  | 'undefined'
  | 'any'
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'map'
  | 'set'

export type StorageSerializersType =
  | 'boolean'
  | 'number'
  | 'string'
  | 'date'
  | 'set'
  | 'map'
  | 'object'
  | 'all'

export type PossibleType =
  | string
  | number
  | boolean
  | Date
  | Map<unknown, unknown>
  | Set<unknown>
  | object

export interface Serializer<T> {
  read(value: string): T
  write(value: T): string
}

export interface UseStorageOptions<T>
  extends ConfigurableFlush,
    ConfigurableEventFilter {
  /**
   * 深度监听 storage 的变化
   *
   * @default true
   */
  deep?: boolean

  /**
   * 是否监听 storage 的变化
   *
   * @default true
   */
  listenToStorageChanges?: boolean

  /**
   * 当 storage 中不存在值，是否写入默认值
   *
   * @default true
   */
  writeDefaults?: boolean

  /**
   * 当读取 storage 中的值，是否合并默认值
   *
   * @default false
   */
  mergeDefaults?: boolean | ((storageValue: T, defaults: T) => T)

  /**
   * 自定义序列化
   */
  serializer?: Serializer<T>
}

/**
 * 默认类型的序列化配置
 */
const StorageSerializers: Record<
  StorageSerializersType,
  Serializer<PossibleType>
> = {
  boolean: {
    read: value => Boolean(value),
    write: value => String(value),
  },
  number: {
    read: value => Number(value),
    write: value => String(value),
  },
  string: {
    read: value => String(value),
    write: value => String(value),
  },
  date: {
    read: value => new Date(value),
    write: (value: Date) => value.toISOString(),
  },
  set: {
    read: value => new Set(JSON.parse(value)),
    write: (value: Set<unknown>) => JSON.stringify([...value.keys()]),
  },
  map: {
    read: value => new Map(JSON.parse(value)),
    write: (value: Map<unknown, unknown>) =>
      JSON.stringify([...value.entries()]),
  },
  object: {
    read: value => JSON.parse(value),
    write: value => JSON.stringify(value),
  },
  all: {
    read: v => v,
    write: value => Object(value),
  },
}

export function useStorage(
  key: string,
  defaults: MaybeRef<string>,
  storage?: Storage,
  options?: UseStorageOptions<string>
): Ref<string>

export function useStorage(
  key: string,
  defaults: MaybeRef<number>,
  storage?: Storage,
  options?: UseStorageOptions<number>
): Ref<number>

export function useStorage(
  key: string,
  defaults: MaybeRef<boolean>,
  storage?: Storage,
  options?: UseStorageOptions<boolean>
): Ref<boolean>

export function useStorage<T>(
  key: string,
  defaults: MaybeRef<T>,
  storage?: Storage,
  options?: UseStorageOptions<T>
): Ref<T>

export function useStorage<T extends PossibleType>(
  key: string,
  defaults: MaybeRef<T>,
  storage?: Storage,
  options: UseStorageOptions<T> = {}
) {
  const {
    flush = 'pre',
    writeDefaults = true,
    mergeDefaults = false,
    deep = true,
    listenToStorageChanges = true,
    serializer: optionSerializer,
    eventFilter,
  } = options
  const state = ref(defaults) as Ref<T>

  // 没有传入 storage，直接返回 state，当做普通 ref 使用
  if (!storage) {
    return state
  }

  // 获取默认值、类型以及对应的序列化函数
  const defaultValue = resolveUnref(defaults)
  const type = guessType(defaultValue)
  const serializer =
    optionSerializer || (StorageSerializers[type] as Serializer<T>)

  // 监听 state 的变化
  const { pause, resume } = watchPausable(
    state,
    value => {
      write(value)
    },
    { deep, flush, eventFilter }
  )

  // 监听 storage 的变化
  listenToStorageChanges && useEventListener(window, 'storage', update)

  update()

  /**
   * 写入 storage
   * @param value
   */
  function write(value: T | null) {
    if (value === null || value === undefined) {
      storage!.removeItem(key)
    } else {
      storage!.setItem(key, serializer.write(value))
    }
  }

  /**
   * 读取 storage
   * @param oldValue
   * @returns
   */
  function read(oldValue: string | null = storage!.getItem(key)) {
    // 暂停 watch 追踪，防止在 mergeDefaults 中修改了 state，从而修改 storage
    pause()

    try {
      // storage 不存在，检查是否要写入默认值，
      if (!oldValue && writeDefaults) {
        write(defaultValue)
        return defaultValue
      }

      if (oldValue) {
        // 序列化读取的值，并与默认值合并
        let value = serializer.read(oldValue)
        if (typeof mergeDefaults === 'function') {
          value = mergeDefaults(value, defaultValue)
        } else if (
          mergeDefaults &&
          type === 'object' &&
          !Array.isArray(defaultValue)
        ) {
          value = { ...(defaultValue as any), ...(value as any) }
        }
        return value
      }

      return defaultValue
    } finally {
      resume()
    }
  }

  /**
   * storage 变化的事件，更新 state
   * @param e
   * @returns
   */
  function update(e?: StorageEvent) {
    if (e) {
      // 过滤修改的不是当前使用的 storage
      if (e.storageArea !== storage) {
        return
      }

      // 过滤修改的不是当前使用的 key
      if (e.key && e.key !== key) {
        return
      }

      if (!e.newValue) {
        // 删除、重置
        state.value = defaultValue
      } else if (!e.oldValue) {
        // 新增
        state.value = serializer.read(e.newValue)
      } else {
        // 修改
        state.value = read(e.newValue)
      }
    } else {
      state.value = read()
    }
  }

  return state
}
