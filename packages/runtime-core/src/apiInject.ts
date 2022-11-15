import { getCurrentInstance } from './component'
import { warn } from './warning'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export interface InjectionKey<T = any> extends Symbol {}

export function provide<T>(key: InjectionKey<T> | string | number, value: T) {
  const instance = getCurrentInstance()
  if (!instance) {
    warn(`provide() can only be used inside setup().`)
    return
  }

  // 若是根组件，此时的 provides 是继承全局 provides 的对象
  // 若不是根组件，此时的 provides 指向的是父级 provides
  // 若当前 provides 和父级 provides 指向同一对象，说明是第一次调用 provide，会创建一个新的对象，且继承父级 provides
  // 第二次不会再新创建
  if (instance.parent && instance.provides === instance.parent.provides) {
    instance.provides = Object.create(instance.parent.provides)
  }

  // 接下来在这个继承父级新创建的对象中添加内容
  instance.provides[key as any] = value
}

export function inject<T>(key: InjectionKey<T> | string): T | undefined
export function inject<T>(key: InjectionKey<T> | string, defaultValue: T): T
export function inject<T>(
  key: InjectionKey<T> | string,
  defaultValue?: T
): T | undefined {
  const instance = getCurrentInstance()
  if (!instance) {
    warn(`inject() can only be used inside setup() or functional components.`)
    return
  }

  // 若是根组件，获则获取全局 provides，若不是则获取父级 provides
  // 此时父级的 provides 会形成原型链，一直到全局 provides
  const parentProviders =
    instance.parent?.provides ?? instance.appContext.providers

  // 这里要用 in 操作，必须检查原形链
  if ((key as string) in parentProviders) {
    return parentProviders[key as string]
  }

  if (arguments.length === 1) {
    warn(`injection "${key}" not found.`)
  }

  return defaultValue
}
