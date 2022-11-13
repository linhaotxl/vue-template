import { ReactiveEffectRunner } from './../../reactivity/src/effect'
import type { VNode } from './vnode'
import { EMPTY_OBJ, isFunction, isPlainObject, NOOP } from '@vue/shared'
import { callWithErrorHandling, ErrorCodes } from './errorHandling'
import {
  initProps,
  NormalizedPropsOptions,
  normalizePropsOptions,
  // PropOptions,
  // PropType,
} from './componentProps'
import type { ComponentOptions } from './componentOptions'
import { PublicInstanceProxyHandlers } from './componentPublicInstance'
import type { ComponentPublicInstance } from './componentPublicInstance'

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
}

type LifecycleHook = Function[] | null
export const enum LifecycleHooks {
  BEFORE_MOUNT = 'bm',
  MOUNTED = 'm',
  BEFORE_UPDATE = 'bu',
  UPDATED = 'u',
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
  ctx: Record<string, any>

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
   * Lifecycle hooks
   */
  [LifecycleHooks.BEFORE_MOUNT]: LifecycleHook
  [LifecycleHooks.MOUNTED]: LifecycleHook
  [LifecycleHooks.BEFORE_UPDATE]: LifecycleHook
  [LifecycleHooks.UPDATED]: LifecycleHook
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
  vNode: VNode
): ComponentInternalInstance {
  const type = vNode.type as ConcreteComponent

  const instance: ComponentInternalInstance = {
    type,
    vNode,
    render: null,
    propOptions: normalizePropsOptions(vNode),
    isMounted: false,
    props: EMPTY_OBJ,
    attrs: EMPTY_OBJ,
    ctx: EMPTY_OBJ,
    proxy: null,
    effect: null,
    subTree: null,
    [LifecycleHooks.BEFORE_MOUNT]: null,
    [LifecycleHooks.MOUNTED]: null,
    [LifecycleHooks.BEFORE_UPDATE]: null,
    [LifecycleHooks.UPDATED]: null,
  }

  instance.ctx = { _: instance }

  return instance
}

/**
 * 安装组件
 * @param instance
 */
export function setupComponent(instance: ComponentInternalInstance) {
  // 初始化 props
  initProps(instance)

  // 安装状态组件
  setupStatefulComponent(instance)
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
  }
}
