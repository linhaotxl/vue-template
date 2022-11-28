import { reactive } from '@vue/reactivity'
import {
  EMPTY_ARR,
  EMPTY_OBJ,
  camelize,
  hasOwn,
  hyphenate,
  isArray,
  isFunction,
  isModelListener,
  isPlainObject,
} from '@vue/shared'

import { isEmitListener } from './componentEmits'
import { warn } from './warning'

import type { Component, ComponentInternalInstance } from './component'
import type { VNode, Props as VNodeProps } from './vnode'

export type ComponentPropsOptions<P> = string[] | ComponentObjectPropsOptions<P>
export type ComponentObjectPropsOptions<P> = {
  [K in keyof P]: Props<P[K]>
}

export type Props<T, D = T> = PropType<T> | PropOptions<T, D>
export type PropType<T> = PropConstructor<T> | PropConstructor<T>[]

type PropConstructor<T> =
  | { new (...args: unknown[]): T }
  | { (...args: unknown[]): T }

export type PropOptions<T = any, D = T> = {
  type?: PropType<T> | null | undefined | object
  required?: boolean
  default?: D | null | undefined | object
}

export type NormalizedProp<T = any> = PropOptions<T> & {
  [BooleanFlags.ShouldCast]?: boolean
}
export type NormalizedProps = Record<string, NormalizedProp>
export type NormalizedPropsOptions = [NormalizedProps, string[]]

export const enum BooleanFlags {
  ShouldCast,
}

/**
 * 格式化组件上声明的 props 选项
 * @param vNode
 * @returns
 */
export function normalizePropsOptions(vNode: VNode): NormalizedPropsOptions {
  // 获取组件声明的 props 选项
  const props = (vNode.type as Component).props

  // 不存在 props 的情况
  if (!props) {
    return [EMPTY_OBJ, EMPTY_ARR as any as string[]]
  }

  // 格式化好的 props 集合
  const propsOptions: NormalizedProps = {}
  // 需要解析 prop 值的属性名集合；包括 Boolean、default 默认值等
  const needCastCamelPropNames: string[] = []

  if (isArray(props)) {
    // props 为数组，将其中的每个 prop name 转换为驼峰化，并存储下来
    for (let i = 0; i < props.length; ++i) {
      const camelizeName = camelize(props[i])
      propsOptions[camelizeName] = EMPTY_OBJ
    }
  } else if (isPlainObject(props)) {
    // prop 为对象，将属性名驼峰化进行存储
    for (const key in props) {
      const raw = (props as any)[key]
      const camelizeName = camelize(key)
      let opt: NormalizedProp

      if (isFunction(raw)) {
        // props: { foo: String }
        opt = { type: raw }
        if (raw === Boolean) {
          // 属性值为 Boolean，标识 ShouldCast 并记录为需要处理的属性
          opt[BooleanFlags.ShouldCast] = true
          needCastCamelPropNames.push(camelizeName)
        }
      } else if (isArray(raw)) {
        // props: { foo: [String, Number] }
        opt = { type: raw }
      } else {
        // props: { foo: { type: Boolean, default: false, required: false, validator () {} } }
        opt = { ...raw }
        if (hasOwn(opt, 'default')) {
          // 存在默认值，记录为需要处理的属性
          needCastCamelPropNames.push(camelizeName)
        }
      }
      propsOptions[camelizeName] = opt
    }
  } else {
    warn(`invalid props options`, props)
  }

  return [propsOptions, needCastCamelPropNames]
}

/**
 * 初始化 props
 * @param instance 组件实例
 */
export function initProps(
  instance: ComponentInternalInstance,
  isStatefulComponent: boolean
) {
  // props 集合
  const props: Record<string, unknown> = {}
  // attrs 集合
  const attrs: Record<string, unknown> = {}

  // 全量设置 props 和 attrs
  setFullProps(instance, instance.vNode.props, props, attrs)

  // 确保声明的 props 都存在 key
  for (const prop in instance.propOptions[0]) {
    if (!hasOwn(props, prop)) {
      props[prop] = undefined
    }
  }

  // 验证 props 值的合法性
  validateProps(props, instance.propOptions[0])

  if (isStatefulComponent) {
    // 状态组件将 props 转为响应对象，并挂载在实例上
    // 这样当组件更新修改 props 时，可以触发追踪的依赖，例如 watch(props.xxx)、子组件更新
    instance.props = reactive(props)
  } else {
    // TODO: 函数组件没有转响应式
    // 没有声明 props 的函数组件，props 和 attrs 均指向 attrs
    // 声明 props 的函数组件和状态组件一样
    instance.props = instance.propOptions[0] === EMPTY_OBJ ? attrs : props
  }

  instance.attrs = attrs
}

/**
 * 更新 props
 * @param instance 组件实例
 * @param rawPrevProps 上一次渲染 vNode 实际传入的 props
 * @param vNode vNode
 */
export function updateProps(
  instance: ComponentInternalInstance,
  rawPrevProps: VNodeProps,
  vNode: VNode
) {
  // 本次渲染实际传入的 props
  const rawProps = vNode.props

  const {
    props,
    attrs,
    propOptions: [options],
  } = instance

  // 先全量更新，此时 props 和 attrs 中会混合新旧值
  setFullProps(instance, rawProps, props, attrs)

  // 接下来需要将删除的 props 设置为 undefined 或者默认值
  for (const prop in props) {
    if (
      // 属性在本次渲染没有传递
      rawProps &&
      !hasOwn(rawProps, prop) &&
      !hasOwn(rawProps, hyphenate(prop))
    ) {
      if (
        // 本次实际没有传入，而上次实际传入了，需要重置
        // 不会处理由默认值生成的 props，它们不会存在实际传递的 props 中
        rawPrevProps &&
        (rawPrevProps[prop] !== undefined ||
          rawPrevProps[hyphenate(prop)] !== undefined)
      ) {
        props[prop] = resolvePropValue(prop, undefined, options[prop])
      }
    }
  }

  // 遍历混合的 attrs，如果属性名不在本次传递的 props 中，则删除
  for (const prop in attrs) {
    if (rawProps && !hasOwn(rawProps, prop)) {
      delete attrs[prop]
    }
  }
}

/**
 * 全量设置 props 和 attrs
 * @param instance 组件实例
 * @param rawProps 实际传递给组件的 props 集合
 * @param props
 * @param attrs
 */
export function setFullProps(
  instance: ComponentInternalInstance,
  rawProps: VNodeProps,
  props: Record<string, unknown>,
  attrs: Record<string, unknown>
) {
  // 获取处理好的组件声明的 props，是一个对象，key 是 prop name，value 是对象，存在 type、default、required、validator
  const {
    propOptions: [propsOptions, needCastCamelPropNames],
    emitOptions,
  } = instance

  // 遍历传递的所有 props
  for (const rawName in rawProps) {
    // 驼峰化属性名
    const camelRawName = camelize(rawName)
    // 检测属性名是否在声明的 props 中
    if (hasOwn(propsOptions, camelRawName)) {
      // props 中还不存在驼峰名，代表是初始化，直接将值存入 props 中
      // props 中存在驼峰名，代表是更新，如果属性的默认值是工厂函数，且新传入的值是 undefined
      // 那么此时不需要更新 props 的值，依旧使用工厂函数返回的值，避免触发追踪依赖（如果有追踪该 props 的依赖）
      if (
        !hasOwn(props, camelRawName) ||
        !(
          hasOwn(propsOptions[camelRawName], 'default') &&
          isFunction(propsOptions[camelRawName].default) &&
          rawProps[rawName] === undefined
        )
      ) {
        props[camelRawName] = rawProps[rawName]
      }
    } else if (
      !isEmitListener(emitOptions, rawName) &&
      !isModelListener(rawName)
    ) {
      // 不存在，将原始属性名和值存储，排除事件监听器
      attrs[rawName] = rawProps[rawName]
    }
  }

  // 处理需要进一步转换的 prop
  for (let i = 0; i < needCastCamelPropNames.length; ++i) {
    const camelPropName = needCastCamelPropNames[i]
    props[camelPropName] = resolvePropValue(
      camelPropName,
      props[camelPropName],
      propsOptions[camelPropName]
    )
  }
}

/**
 * 解析 prop 的值
 * @param camelPropName 驼峰属性名
 * @param rawValue
 * @param propOptions
 * @returns
 */
function resolvePropValue(
  camelPropName: string,
  rawValue: any,
  propOptions: NormalizedProp | undefined
) {
  // 需要进行布尔值的转换，带有 ShouldCast 说明声明的 type 带有 Boolean
  if (propOptions && propOptions[BooleanFlags.ShouldCast] != null) {
    // props: { fooBar: Boolean }
    if (typeof rawValue === 'undefined') {
      // 没有传值，默认为 false；<comp />
      return false
    }
    if (rawValue === '' || rawValue === camelPropName) {
      // <comp fooBar="fooBar" />
      return true
    }
    warn(`type check failed for prop "${camelPropName}"`)
  }

  // 处理默认值
  const hasDefault = propOptions && hasOwn(propOptions, 'default')
  // 存在默认值且没有传递该值时才会使用默认值
  if (hasDefault && typeof rawValue === 'undefined') {
    if (isFunction(propOptions.default) && propOptions.type !== Function) {
      // default 为函数，且 type 不是 Function，这时需要调用 default 函数获取默认值
      return propOptions.default()
    } else {
      // 剩余情况直接使用 default 作为默认值
      return propOptions.default
    }
  }

  return rawValue
}

function validateProps(props: Record<string, any>, options: NormalizedProps) {
  for (const name in options) {
    const opt = options[name]
    validateProp(name, props[name], opt)
  }
}

function validateProp(name: string, value: unknown, opt: NormalizedProp) {
  if (typeof value === 'undefined' && opt.required) {
    warn(`Missing required prop: "${name}"`)
  }
}
