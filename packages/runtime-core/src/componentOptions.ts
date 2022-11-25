import { isFunction } from '@vue/shared'

import {
  onBeforeMount,
  onBeforeUpdate,
  onMounted,
  onUpdated,
} from './apiLifecycle'
import { LifecycleHooks } from './component'
import { callWithErrorHandling } from './errorHandling'
import { warn } from './warning'

import type { createHook } from './apiLifecycle'
import type { Component, ComponentInternalInstance } from './component'
import type { EmitOptions } from './componentEmits'
import type { ComponentPropsOptions } from './componentProps'
import type { VNode } from './vnode'

export type RenderFunction = (props: Record<string, any>) => VNode

export type ComponentOptions<
  Props = {},
  RawBindings = {}
> = ComponentOptionsBase<Props, RawBindings>

export interface ComponentOptionsBase<Props, RawBindings>
  extends LegacyOptions {
  name?: string

  props?: ComponentPropsOptions<Props>

  components?: Record<string, Component>

  setup?: () => RenderFunction | RawBindings

  data?: () => Record<string, any>

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
      // 调用 data 获取 state，并挂载在实例上
      const dataState = data()
      instance.data = dataState
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
