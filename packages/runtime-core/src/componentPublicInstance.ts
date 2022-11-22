import { hasOwn, isString } from '@vue/shared'
import type { ComponentInternalInstance } from './component'
import { markAttrsAccessed } from './componentRenderUtils'

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
 * 对 instance.ctx 的代理行为
 */
export const PublicInstanceProxyHandlers: ProxyHandler<any> = {
  get(ctx: ComponentPublicCtx, p, receiver) {
    const { _: instance } = ctx

    if (isString(p) && p.startsWith('$') && hasOwn(publicPropertiesMap, p)) {
      return publicPropertiesMap[p](instance)
    }

    const { props, setupState, data } = instance

    if (hasOwn(setupState, p)) {
      return setupState[p]
    }

    if (hasOwn(data, p)) {
      return data[p]
    }

    if (hasOwn(props, p)) {
      return props[p]
    }

    if (hasOwn(ctx, p)) {
      return ctx[p]
    }
  },

  set(ctx: ComponentPublicCtx, p, value) {
    const {
      _: { setupState, data },
    } = ctx

    if (hasOwn(setupState, p)) {
      setupState[p] = value
    } else if (hasOwn(data, p)) {
      data[p] = value
    } else {
      ctx[p] = value
    }

    return true
  },

  has(ctx: ComponentPublicCtx, p) {
    const {
      _: { setupState, data, props },
    } = ctx

    if (hasOwn(publicPropertiesMap, p)) {
      return true
    } else if (hasOwn(setupState, p)) {
      return true
    } else if (hasOwn(data, p)) {
      return true
    } else if (hasOwn(props, p)) {
      return true
    } else if (hasOwn(ctx, p)) {
      return ctx[p]
    }

    return false
  },

  defineProperty(target: ComponentPublicCtx, p, attributes) {
    const {
      _: { setupState, data, props },
    } = target

    if (hasOwn(setupState, p)) {
      return Reflect.defineProperty(setupState, p, attributes)
    } else if (hasOwn(data, p)) {
      return Reflect.defineProperty(data, p, attributes)
    } else if (hasOwn(target, p)) {
      return Reflect.defineProperty(target, p, attributes)
    }

    return false
  },
}
