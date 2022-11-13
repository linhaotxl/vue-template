import { hasOwn, isString } from '@vue/shared'
import type { ComponentInternalInstance } from './component'

export type ComponentPublicInstance = {}

const publicPropertiesMap: Record<
  string,
  (instance: ComponentInternalInstance) => any
> = {
  $props: instance => instance.props,
  $attrs: instance => instance.attrs,
}

/**
 * 对 instance.ctx 的代理行为
 */
export const PublicInstanceProxyHandlers: ProxyHandler<any> = {
  get({ _: instance }: { _: ComponentInternalInstance }, property, receiver) {
    if (
      isString(property) &&
      property.startsWith('$') &&
      hasOwn(publicPropertiesMap, property)
    ) {
      return publicPropertiesMap[property](instance)
    }

    const { props, attrs } = instance

    // TODO: 先从 props 中读取
    if (hasOwn(props, property)) {
      return props[property]
    }
  },
}
