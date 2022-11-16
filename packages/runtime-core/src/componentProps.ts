import {
  camelize,
  EMPTY_OBJ,
  hasOwn,
  hyphenate,
  isArray,
  isFunction,
  isPlainObject,
} from '@vue/shared'
import type { ComponentInternalInstance, ConcreteComponent } from './component'
import { isEmitListener } from './componentEmits'
import type { Props as VNodeProps, VNode } from './vnode'
import { warn } from './warning'

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
  const props = (vNode.type as ConcreteComponent).props

  // 不存在 props 的情况
  if (!props) {
    return [{}, []]
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
      const raw = props[key]
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
export function initProps(instance: ComponentInternalInstance) {
  // props 集合
  const props: Record<string, unknown> = {}
  // attrs 集合
  const attrs: Record<string, unknown> = {}

  // 全量设置 props 和 attrs
  setFullProps(instance, instance.vNode.props, props, attrs)

  // 验证 props 值的合法性
  validateProps(props, instance.propOptions[0])

  // 将存储好的 props 和 attrs 记录在组件实例撒好难过
  instance.props = props
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
        // 属性在上次渲染传递过，rawPrevProps 只会包含实际传递的属性，不会包含应默认值生成的属性
        // 索引由默认值生成的属性是会直接跳过的
        rawPrevProps &&
        (rawPrevProps[prop] !== undefined ||
          rawPrevProps[hyphenate(prop)] !== undefined)
      ) {
        props[prop] = resolvePropValue(prop, undefined, options[prop])
      }
    }
  }

  // 遍历混合的 attrs，如果属性名不在传递的 props 中，则删除
  for (const prop in attrs) {
    if (rawProps && !hasOwn(rawProps, prop)) {
      delete attrs[prop]
    }
  }
}

/**
 * 全量设置 props 和 attrs
 * @param instance 组件实例
 * @param rawProps 传递给组件的 props 集合
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
  const [propsOptions, needCastCamelPropNames] = instance.propOptions

  // 遍历传递的所有 props
  for (const rawName in rawProps) {
    // 驼峰化属性名
    const camelRawName = camelize(rawName)
    // 检测属性名是否在声明的 props 中
    if (hasOwn(propsOptions, camelRawName)) {
      // 存在，将驼峰化的属性名和值存储
      props[camelRawName] = rawProps[rawName]
    } else if (!isEmitListener(rawProps, rawName)) {
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
 * @param camelPropName
 * @param rawValue
 * @param propOptions
 * @returns
 */
function resolvePropValue(
  camelPropName: string,
  rawValue: any,
  propOptions: NormalizedProp
) {
  // 需要进行布尔值的转换，带有 ShouldCast 说明声明的 type 带有 Boolean
  if (propOptions[BooleanFlags.ShouldCast] != null) {
    // props: { foo: Boolean }
    if (typeof rawValue === 'undefined') {
      // 没有传值，默认为 false；<comp />
      return false
    }
    if (rawValue === '' || rawValue === camelPropName) {
      // <comp foo="foo" />
      return true
    }
    warn(`type check failed for prop "${camelPropName}"`)
  }

  // 处理默认值
  const hasDefault = hasOwn(propOptions, 'default')
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
