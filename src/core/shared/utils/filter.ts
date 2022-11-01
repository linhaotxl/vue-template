import { ref } from 'vue'
import { Fn } from './types'

export type FunctionArgs<Args extends any[] = any[], Return = void> = (
  ...args: Args
) => Return

export interface FunctionWrapperOptions<This = any, Args = any> {
  fn: Fn

  thisArg: This

  args: Args
}

/**
 * 过滤器函数
 */
export type EventFilter = (invoke: Fn, options: FunctionWrapperOptions) => void

/**
 * 带有过滤器的配置
 */
export interface ConfigurableEventFilter {
  eventFilter?: EventFilter
}

/**
 * 创建过滤器包裹函数
 * @param filter 过滤函数
 * @param fn 需要执行的函数
 * @returns
 */
export function createFilterWrapper<T extends FunctionArgs>(
  filter: EventFilter,
  fn: T
) {
  function filterWrapper(this: any, ...args: any) {
    filter(() => fn.apply(this, args), { fn, thisArg: this, args })
  }

  return filterWrapper as T
}

/**
 * 默认的过滤器函数，直接调用原始函数
 * @param invoke
 * @returns
 */
export const bypassFilter: EventFilter = invoke => invoke()

/**
 * 可控制的过滤器
 * @param filter 过滤器
 * @returns
 */
export function pausableFilter(filter: EventFilter) {
  const isActive = ref(true)

  /**
   * 暂停过滤器
   */
  function pause() {
    isActive.value = false
  }

  /**
   * 活肤过滤器
   */
  function resume() {
    isActive.value = true
  }

  /**
   * 过滤器方法
   */
  const eventFilter: EventFilter = (invoke, options) => {
    if (isActive.value) {
      filter(invoke, options)
    }
  }

  return {
    isActive,
    pause,
    resume,
    eventFilter,
  }
}
