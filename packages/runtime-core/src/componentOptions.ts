import { reactive } from '@vue/reactivity'
import { hasOwn, isFunction } from '@vue/shared'

import {
  onBeforeMount,
  onBeforeUpdate,
  onMounted,
  onUpdated,
} from './apiLifecycle'
import { createPathGetter, watch } from './apiWatch'
import { LifecycleHooks } from './component'
import { callWithErrorHandling } from './errorHandling'
import { warn } from './warning'

import type { createHook } from './apiLifecycle'
import type { WatchCallback, WatchOptions } from './apiWatch'
import type { Component, ComponentInternalInstance } from './component'
import type { EmitOptions } from './componentEmits'
import type { ComponentPropsOptions } from './componentProps'
import type { VNode } from './vnode'

export type RenderFunction = (props: Record<string, any>) => VNode

export type ComponentOptions<
  Props = {},
  RawBindings = {}
> = ComponentOptionsBase<Props, RawBindings>

export interface ObjectWatchOptionItem {
  handler: WatchCallback
  immediate?: boolean
  deep?: boolean
  flush?: 'pre' | 'post' | 'sync'
}

export type WatchOptionItem = ObjectWatchOptionItem | WatchCallback

export interface ComponentOptionsBase<Props, RawBindings>
  extends LegacyOptions {
  name?: string

  props?: ComponentPropsOptions<Props>

  components?: Record<string, Component>

  setup?: () => RenderFunction | RawBindings

  data?: () => Record<string, any>

  watch?: Record<string, WatchOptionItem>

  emits?: EmitOptions

  render?: Function

  inheritAttrs?: boolean

  beforeCreated?: () => void

  created?: () => void

  beforeMount?: () => void

  mounted?: () => void

  beforeUpdate?: () => void

  updated?: () => void
}

export interface LegacyOptions {
  data?: () => unknown
}

export function applyOptionsApi(instance: ComponentInternalInstance) {
  const Component = instance.vNode.type as ComponentOptions
  const {
    data,
    watch: watchOptions,

    beforeCreated,
    created,
    beforeMount,
    mounted,
    beforeUpdate,
    updated,
    components,
  } = Component

  // 调用 beforeCreate hook
  if (beforeCreated) {
    callWithErrorHandling(
      beforeCreated.bind(instance.proxy),
      LifecycleHooks.BEFORE_CREATE
    )
  }

  // 处理 data
  if (data) {
    if (isFunction(data)) {
      // 调用 data 获取 state，并挂载在实例上，并且要做响应化
      const dataState = data()
      instance.data = reactive(dataState)
    } else {
      warn('')
    }
  }

  // 注册本地组件
  if (components) {
    for (const name in components) {
      instance.components ||= Object.create(null)
      instance.components![name] = components[name]
    }
  }

  // 调用 created hook
  if (created) {
    callWithErrorHandling(created.bind(instance.proxy), LifecycleHooks.CREATED)
  }

  // 处理 watch 选项
  if (watchOptions) {
    const proxy = instance.proxy!
    for (const key in watchOptions) {
      const getter = createPathGetter(key, proxy)
      const opt = watchOptions[key]
      let handler: WatchCallback
      let options: WatchOptions

      if (isFunction(opt)) {
        handler = opt
      } else {
        ;({ handler, ...options } = opt)
      }

      if (key in proxy || key.split('.')[0] in proxy) {
        watch(getter, handler, options!)
      }
    }
  }

  /**
   * 注册生命周期函数
   * @param hook 实际需要执行的生命周期函数
   * @param register 生命周期对应的 hook
   */
  function registerHooks(
    hook: (() => void) | undefined,
    register: ReturnType<typeof createHook>
  ) {
    // 将生命周期函数通过 register 注册，并绑定 this 为 instance.proxy
    if (hook) {
      register(hook.bind(instance.proxy))
    }
  }

  registerHooks(beforeMount, onBeforeMount)
  registerHooks(mounted, onMounted)
  registerHooks(beforeUpdate, onBeforeUpdate)
  registerHooks(updated, onUpdated)
}
