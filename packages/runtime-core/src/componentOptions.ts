import { isFunction } from '@vue/shared'
import {
  createHook,
  onBeforeMount,
  onBeforeUpdate,
  onMounted,
  onUpdated,
} from './apiLifecycle'
import {
  Component,
  ComponentInternalInstance,
  LifecycleHooks,
} from './component'
import type { ComponentPropsOptions } from './componentProps'
import { callWithErrorHandling } from './errorHandling'
import type { VNode } from './vnode'
import { warn } from './warning'

export type RenderFunction = () => VNode

export type ComponentOptions<Props, RawBindings> = ComponentOptionsBase<
  Props,
  RawBindings
>

export interface ComponentOptionsBase<Props, RawBindings>
  extends LegacyOptions {
  name?: string

  props?: ComponentPropsOptions<Props>

  components?: Record<string, Component>

  setup?: () => RenderFunction | RawBindings

  data?: () => Record<string, any>

  render?: Function

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
  const Component = instance.vNode.type as Component
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
      beforeCreated.bind(instance),
      LifecycleHooks.BEFORE_CREATE
    )
  }

  // 处理 data
  if (data) {
    if (isFunction(data)) {
      instance.data = data()
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
    callWithErrorHandling(created.bind(instance), LifecycleHooks.CREATED)
  }

  function registerHooks(
    hook: (() => void) | undefined,
    register: ReturnType<typeof createHook>
  ) {
    if (hook) {
      register(hook.bind(instance.proxy))
    }
  }

  registerHooks(beforeMount, onBeforeMount)
  registerHooks(mounted, onMounted)
  registerHooks(beforeUpdate, onBeforeUpdate)
  registerHooks(updated, onUpdated)
}
