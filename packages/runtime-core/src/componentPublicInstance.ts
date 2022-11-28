import { hasOwn, isString } from '@vue/shared'

import { markAttrsAccessed } from './componentRenderUtils'
import { warn } from './warning'

import type { ComponentInternalInstance } from './component'

export type ComponentPublicInstance = {
  $props: Record<string, any>
  $attrs: Record<string, any>
  $emit: ComponentInternalInstance['emit']
  $el: any
}

export type ComponentPublicCtx = {
  _: ComponentInternalInstance
  [x: string | symbol]: any
}

const publicPropertiesMap: Record<
  string,
  (instance: ComponentInternalInstance) => any
> = {
  $props: instance => instance.props,
  $attrs: instance => {
    markAttrsAccessed()
    return instance.attrs
  },
  $emit: instance => instance.emit,
  $el: instance => instance.vNode.el,
}

/**
 * 对 instance.ctx 的代理行为，即访问 instance.proxy 都会被代理
 */
export const PublicInstanceProxyHandlers: ProxyHandler<any> = {
  get(ctx: ComponentPublicCtx, p) {
    const { _: instance } = ctx

    // 如果访问的是内部实例，则从内部实例中获取
    if (isString(p) && hasOwn(publicPropertiesMap, p)) {
      return publicPropertiesMap[p](instance)
    }

    const {
      props,
      setupState,
      data,
      appContext: {
        config: { globalProperties },
      },
    } = instance

    // 从 setupState 中获取
    if (hasOwn(setupState, p)) {
      return setupState[p]
    }

    // 从 data 中获取
    if (hasOwn(data, p)) {
      return data[p]
    }

    // 从 props 中获取
    if (hasOwn(props, p)) {
      return props[p]
    }

    // 从 ctx 上获取
    if (hasOwn(ctx, p)) {
      return ctx[p]
    }

    // 从 global 上获取
    if (hasOwn(globalProperties, p)) {
      return globalProperties[p]
    }
  },

  // setter 拦截
  // 注意 setter 时不会设置 globalProperties
  set(ctx: ComponentPublicCtx, p, value) {
    const {
      _: { setupState, data, props },
    } = ctx

    if (hasOwn(setupState, p)) {
      // TODO: 修改 setupState 中的值
      setupState[p] = value
    } else if (hasOwn(data, p)) {
      // TODO: 修改 data 中的值
      data[p] = value
    } else if (hasOwn(props, p)) {
      warn(`Attempting to mutate prop "${p}"`)
      throw new TypeError('error')
    } else {
      // 兜底修改 ctx 中的值
      ctx[p] = value
    }

    return true
  },

  has(ctx: ComponentPublicCtx, p) {
    const {
      _: { setupState, data, props },
    } = ctx

    // 依次检查
    // 1. 内部属性
    // 2. setup 状态
    // 3. data 状态
    // 4. props
    // 5. 兜底 ctx
    return (
      hasOwn(publicPropertiesMap, p) ||
      hasOwn(setupState, p) ||
      hasOwn(data, p) ||
      hasOwn(props, p) ||
      hasOwn(ctx, p)
    )
  },

  // defineProperty 拦截
  defineProperty(target: ComponentPublicCtx, p, attributes) {
    if (hasOwn(attributes, 'value')) {
      this.set!(target, p, attributes.value, this)
    }

    return Reflect.defineProperty(target, p, attributes)
  },
}
