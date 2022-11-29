import { proxyRefs, reactive, readonly } from '@vue/reactivity'
import {
  EMPTY_OBJ,
  NOOP,
  ShapeFlags,
  isFunction,
  isPlainObject,
} from '@vue/shared'

import { defaultAppContext } from './apiCreateApp'
import { emit, normalizeEmitsOptions } from './componentEmits'
import { applyOptionsApi } from './componentOptions'
import { initProps, normalizePropsOptions } from './componentProps'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import { markAttrsAccessed } from './componentRenderUtils'
import { ErrorCodes, callWithErrorHandling } from './errorHandling'
import { warn } from './warning'

import type { ReactiveEffect } from './../../reactivity/src/effect'
import type { AppContext } from './apiCreateApp'
import type { EmitOptions, ObjectEmitsOptions } from './componentEmits'
import type { ComponentOptions } from './componentOptions'
import type {
  ComponentPropsOptions,
  NormalizedPropsOptions,
} from './componentProps'
import type {
  ComponentPublicCtx,
  ComponentPublicInstance,
} from './componentPublicInstance'
import type { VNode } from './vnode'
import type { ReactiveEffectRunner } from '@vue/reactivity'

export interface ClassComponent {
  __vccOpts: object
}

export interface FunctionalComponent<P extends {} = {}> {
  (props: P, ctx: SetupContext): VNode
  props?: ComponentPropsOptions<P>
  inheritAttrs?: boolean
  emits: EmitOptions
}

export type Component<Props extends {} = {}, RawBindings = {}> =
  | ComponentOptions<Props, RawBindings>
  | FunctionalComponent<Props>

export interface SetupContext {
  attrs: Record<string, any>
  emit: ComponentInternalInstance['emit']
}

type LifecycleHook = Function[] | null
export const enum LifecycleHooks {
  BEFORE_CREATE = 'bc',
  CREATED = 'c',
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
  BEFORE_UNMOUNT = 'bum',
  UNMOUNTED = 'um',
}

export interface ComponentInternalInstance {
  /**
   * vNode.type
   */
  type: Component

  /**
   * 组件对应的 vNode
   */
  vNode: VNode

  /**
   * 父组件
   */
  parent: ComponentInternalInstance | null

  /**
   * 状态组件渲染函数，而不是函数组件
   */
  render:
    | ((this: ComponentPublicInstance, ctx: ComponentPublicInstance) => VNode)
    | null

  /**
   * 组件声明的 props 相关配置
   * 0: 统一结构的 props 声明集合，key 为驼峰属性名，value 为对象，即 NormalizedProp
   * 1: 需要处理属性值的属性名集合，包括 Boolean 的转换，默认值等
   */
  propOptions: NormalizedPropsOptions

  /**
   * 事件触发相关配置
   */
  emitOptions: ObjectEmitsOptions | null

  /**
   * 组件更新时的新 vNode，只有当父组件更新引起子组件更新是才会存在
   * 组件内部状态变化引起的更新是没有的
   */
  next: VNode | null

  /**
   * 是否挂载
   */
  isMounted: boolean

  /**
   * props 结集合
   */
  props: Record<string, any>

  /**
   * attrs 集合
   */
  attrs: Record<string, any>

  /**
   * 作用域
   */
  ctx: ComponentPublicCtx

  /**
   * 组件代理
   */
  proxy: ComponentPublicInstance | null

  /**
   * 组件更新的 effect
   */
  effect: ReactiveEffectRunner | null

  /**
   * 组件的更新函数，是 effect 的调度任务
   */
  update: (() => void) | null

  /**
   * 组件产生的 effect 集合，例如 watch，在卸载时需要将他们失效
   */
  effects: ReactiveEffect[] | null

  /**
   * 组件子节点树
   */
  subTree: VNode | null

  /**
   * setup 状态
   */
  setupState: Record<string, any>

  /**
   * data 状态
   */
  data: Record<string, any>

  /**
   * 本地注册组件
   */
  components: Record<string, Component> | null

  /**
   * app 作用域
   */
  appContext: AppContext

  /**
   * provide 提供的数据容器
   */
  provides: Record<string | symbol | number, any>

  /**
   * emit 函数
   */
  emit: (name: string, ...args: unknown[]) => void

  /**
   * once 事件处理标识
   */
  emitted: Record<string, boolean> | null

  /**
   * Lifecycle hooks
   */
  [LifecycleHooks.BEFORE_CREATE]: LifecycleHook
  [LifecycleHooks.CREATED]: LifecycleHook
  [LifecycleHooks.BEFORE_MOUNT]: LifecycleHook
  [LifecycleHooks.MOUNTED]: LifecycleHook
  [LifecycleHooks.BEFORE_UPDATE]: LifecycleHook
  [LifecycleHooks.UPDATED]: LifecycleHook
  [LifecycleHooks.BEFORE_UNMOUNT]: LifecycleHook
  [LifecycleHooks.UNMOUNTED]: LifecycleHook
}

// 当前正在运行的组件实例
let currentInstance: ComponentInternalInstance | null = null

export function getCurrentInstance() {
  return currentInstance
}

export function setCurrentInstance(instance: ComponentInternalInstance | null) {
  currentInstance = instance
}

/**
 * 创建组件实例对象
 * @param vNode
 * @returns
 */
export function createComponentInstance(
  vNode: VNode,
  parent?: ComponentInternalInstance
): ComponentInternalInstance {
  const type = vNode.type as Component

  // 设置组件的 app context，根组件直接从 vNode 上获取（vNode 上的 appContext 在 mount 时设置）
  // 子组件继承父组件
  const appContext =
    vNode.appContext || (parent?.appContext ?? defaultAppContext)

  // 设置组件的 provides
  // 根组件继承 appContext 上的内容，子组件和父组件使用同一个
  // 如果使用了 provide 函数，则会重新创建一个继承父组件的 provides
  const provides = parent
    ? parent.provides
    : Object.create(appContext.providers)

  const instance: ComponentInternalInstance = {
    appContext,
    type,
    parent: parent || null,
    vNode,
    render: null,
    propOptions: normalizePropsOptions(vNode),
    emitOptions: normalizeEmitsOptions(vNode),
    isMounted: false,
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    ctx: {} as ComponentPublicCtx,
    proxy: null,
    emit: null!,
    next: null,
    effect: null,
    subTree: null,
    setupState: EMPTY_OBJ,
    data: EMPTY_OBJ,
    components: null,
    emitted: null,
    update: null,
    provides,
    effects: null,

    [LifecycleHooks.BEFORE_CREATE]: null,
    [LifecycleHooks.CREATED]: null,
    [LifecycleHooks.BEFORE_MOUNT]: null,
    [LifecycleHooks.MOUNTED]: null,
    [LifecycleHooks.BEFORE_UPDATE]: null,
    [LifecycleHooks.UPDATED]: null,
    [LifecycleHooks.BEFORE_UNMOUNT]: null,
    [LifecycleHooks.UNMOUNTED]: null,
  }

  instance.emit = (name: string, ...args: unknown[]) => {
    emit(instance, name, ...args)
  }

  // 定义 ctx._ 指向组件实例，且不可枚举
  Object.defineProperty(instance.ctx, '_', {
    writable: true,
    enumerable: false,
    value: instance,
  })

  return instance
}

/**
 * 安装组件
 * @param instance
 */
export function setupComponent(instance: ComponentInternalInstance) {
  // 是否是状态组件
  const isStatefulComponent = !!(
    instance.vNode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT
  )

  // 初始化 props
  initProps(instance, isStatefulComponent)

  if (isStatefulComponent) {
    // 安装状态组件
    setupStatefulComponent(instance)
  }
}

/**
 * 安装状态组件
 * @param instance
 */
export function setupStatefulComponent(instance: ComponentInternalInstance) {
  const { type } = instance

  // 创建 ctx 的代理对象，访问组件上的任何属性都会被代理
  instance.proxy = new Proxy(instance.ctx, PublicInstanceProxyHandlers)

  const { setup } = type as ComponentOptions
  if (isFunction(setup)) {
    // 存在 setup，调用
    const setupResult = callWithErrorHandling(
      setup,
      ErrorCodes.SETUP_FUNCTION,
      [readonly(instance.props), createSetupContext(instance)]
    )
    // 处理 setup 返回结果
    handleSetupResult(instance, setupResult)
  } else {
    // 不存在 setup，直接进行兜底操作
    finishComponent(instance)
  }
}

/**
 * 处理 setup 返回结果
 * @param instance
 * @param setupResult
 */
function handleSetupResult(
  instance: ComponentInternalInstance,
  setupResult: unknown
) {
  if (isFunction(setupResult)) {
    // setup 返回函数，将其作为渲染函数
    instance.render = setupResult as ComponentInternalInstance['render']
  } else if (isPlainObject(setupResult)) {
    // 对 setup 状态进行代理，主要处理 ref 解绑 value
    // 即访问 setupState 中的值是 ref 时，会自动获取 .value
    // 之所以不用 reactive 作代理是因为 setupState 都是由响应式对象组成的，修改时直接修改响应式对象自身即可触发追踪的依赖
    instance.setupState = proxyRefs(setupResult)
  }

  // 兜底操作
  finishComponent(instance)
}

/**
 * 组件安装完成，最后进行兜底操作
 * @param instance
 */
export function finishComponent(instance: ComponentInternalInstance) {
  if (!instance.render) {
    // 兜底，将组件上的 render 函数作为渲染函数
    instance.render = ((instance.type as ComponentOptions).render ||
      NOOP) as ComponentInternalInstance['render']
  }

  if (instance.render === (NOOP as any)) {
    warn('Component is missing template or render function')
  }

  // 兼容 option api
  applyOptionsApi(instance)
}

export const isClassComponent = (value: any): value is ClassComponent =>
  isFunction(value) && isPlainObject(value.__vccOpts)

/**
 * 创建 setup 函数的作用域，即第二个参数
 * @param instance
 * @returns
 */
function createSetupContext(instance: ComponentInternalInstance): SetupContext {
  // 创建 attrs 的代理，当尝试访问其中属性时，需要标识访问 attrs 的开关
  // 在每次 render 开始时，首先会将开关置为 false，如果在 render 中访问了则会将其置为 true
  const attrsProxy = new Proxy(instance.attrs, {
    get(target, p, receiver) {
      markAttrsAccessed()
      return Reflect.get(target, p, receiver)
    },
  })

  return {
    attrs: attrsProxy,
    emit: instance.emit,
  }
}
