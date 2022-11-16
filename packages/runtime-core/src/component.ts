import { ReactiveEffectRunner } from './../../reactivity/src/effect'
import type { VNode } from './vnode'
import {
  EMPTY_OBJ,
  isFunction,
  isPlainObject,
  NOOP,
  ShapeFlags,
} from '@vue/shared'
import { callWithErrorHandling, ErrorCodes } from './errorHandling'
import {
  initProps,
  NormalizedPropsOptions,
  normalizePropsOptions,
} from './componentProps'
import { applyOptionsApi, ComponentOptions } from './componentOptions'
import {
  ComponentPublicCtx,
  PublicInstanceProxyHandlers,
} from './componentPublicInstance'
import type { ComponentPublicInstance } from './componentPublicInstance'
import { AppContext, defaultAppContext } from './apiCreateApp'
import { proxyRefs } from '@vue/reactivity'
import { warn } from './warning'
import {
  emit,
  normalizeEmitsOptions,
  ObjectEmitsOptions,
} from './componentEmits'

export type InternalRenderFunction = () => VNode

export interface ClassComponent {
  __vccOpts: object
}

export type ConcreteComponent<
  Props = any,
  RawBindings = any
> = ComponentOptions<Props, RawBindings>

export type Component<RawBindings = any> = ConcreteComponent<RawBindings>

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
  type: ConcreteComponent

  /**
   * 组件对应的 vNode
   */
  vNode: VNode

  /**
   * 父组件
   */
  parent: ComponentInternalInstance | null

  /**
   * 组件渲染函数
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
   * 是否挂在
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
  const type = vNode.type as ConcreteComponent

  const appContext =
    vNode.appContext || (parent?.appContext ?? defaultAppContext)

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
    effect: null,
    subTree: null,
    setupState: EMPTY_OBJ,
    data: EMPTY_OBJ,
    components: null,
    emitted: null,
    // 每个组件的 provider 向上继承，根组件继承全局 provider
    provides: parent ? parent.provides : Object.create(appContext.providers),
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
  // 初始化 props
  initProps(instance)

  if (instance.vNode.shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
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

  const { setup } = type
  if (isFunction(setup)) {
    // 存在 setup，调用
    const setupResult = callWithErrorHandling(
      setup,
      ErrorCodes.SETUP_FUNCTION,
      [instance.props, createSetupContext(instance)]
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
    instance.render = setupResult as InternalRenderFunction
  } else if (isPlainObject(setupResult)) {
    // 对 setup 状态进行代理，主要处理 ref 解绑 value
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
    instance.render = (instance.type.render || NOOP) as InternalRenderFunction
  }

  if (instance.render === (NOOP as any)) {
    warn('Component is missing template or render function')
  }

  applyOptionsApi(instance)
}

export const isClassComponent = (value: any): value is ClassComponent =>
  isFunction(value) && isPlainObject(value.__vccOpts)

/**
 * 创建 setup 函数的第二个参数
 * @param instance
 * @returns
 */
function createSetupContext(instance: ComponentInternalInstance): SetupContext {
  return {
    attrs: instance.attrs,
    emit: instance.emit,
  }
}
