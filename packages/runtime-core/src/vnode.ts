import type { RendererElement } from './renderer'
import {
  isArray,
  isFunction,
  isOn,
  isPlainObject,
  isString,
  PatchFlags,
  ShapeFlags,
} from '@vue/shared'
import {
  Component,
  ComponentInternalInstance,
  isClassComponent,
} from './component'
import { warn } from './warning'

export const Comment = Symbol('Comment')
export const Text = Symbol('Text')
export const Fragment = Symbol('Fragment')

export type VNodeTypes =
  | string
  | typeof Comment
  | typeof Fragment
  | typeof Text
  | Function
  | Component

export type Data = Record<string, any>

export type VNodeProps = {
  key?: string | number
}

export type Props = (Data & VNodeProps) | null

export interface VNode<HostElement extends RendererElement = RendererElement> {
  __v_isVNode: boolean

  type: VNodeTypes

  props: Props

  children: unknown

  key: string | number | null

  shapeFlag: ShapeFlags

  patchFlag: PatchFlags

  dynamicChildren: VNode[] | null

  /**
   * 组件实例
   */
  component: ComponentInternalInstance | null

  el: HostElement | null
}

/**
 * 创建 vnode
 * @param type
 * @param props
 * @param children
 * @param patchFlag
 * @returns
 */
export function createVNode(
  type: VNodeTypes,
  props: Props = null,
  children: unknown = null,
  patchFlag = 0,
  isBlock = false
) {
  // type 类型无效时，会视为注释
  if (!type) {
    warn(`Invalid vnode type when creating vnode: ${type}.`)
    type = Comment
  }

  // 检测是否是 class component
  if (isClassComponent(type)) {
    type = type.__vccOpts
  }

  // 检测 type 是否是 vNode，如果是则进行克隆
  if (isVNode(type)) {
    const cloned = cloneVNode(type, props)
    if (children) {
      cloned.children = normalizeChildren(children)
      cloned.shapeFlag = normalizeShapeFlag(cloned.type, cloned.children)
    }

    return cloned
  }

  // 解析 key
  const resolveKey = props ? (props.key == null ? null : props.key) : null

  // key 不能是 NaN
  if (resolveKey !== resolveKey) {
    warn('VNode created with invalid key (NaN)')
  }

  if (props) {
    // 格式化 class
    if (props.class) {
      props.class = normalizeClass(props.class)
    }

    // 格式化 style
    if (props.style) {
      props.style = normalizeStyle(props.style)
    }
  }

  // 解析 children
  const resolveChildren = normalizeChildren(children)

  // 解析 shapeFlag
  const resolveShapeFlag = normalizeShapeFlag(type, resolveChildren)

  // 创建 vnode 节点
  const vNode: VNode = {
    __v_isVNode: true,
    type,
    props,
    children: resolveChildren,
    key: resolveKey,
    shapeFlag: resolveShapeFlag,
    patchFlag,
    dynamicChildren: isBlock ? [] : null,
    component: null,
    el: null,
  }

  // patchFlag 存在且不是 HYDRATE_EVENTS 视为动态节点
  // 组件视为动态节点
  if (
    isBlockTreeEnabled > 0 &&
    currentBlock &&
    (patchFlag > 0 ||
      resolveShapeFlag & ShapeFlags.FUNCTIONAL_COMPONENT ||
      resolveShapeFlag & ShapeFlags.STATEFUL_COMPONENT) &&
    patchFlag !== PatchFlags.HYDRATE_EVENTS
  ) {
    currentBlock.push(vNode)
  }

  return vNode
}

/**
 * 检测是否是 vNode
 * @param vNode
 * @returns
 */
export const isVNode = (vNode: any): vNode is VNode => vNode.__v_isVNode

/**
 * 格式化 class，将 string | string[] | object 均格式化为字符串
 * @param className
 * @returns
 */
function normalizeClass(
  className: string | string[] | Record<string, any>
): string {
  if (isString(className)) {
    return className
  }

  let value = ''
  if (isArray(className)) {
    for (let i = 0; i < className.length; ++i) {
      value += ' ' + normalizeClass(className[i])
    }
  } else {
    for (const name in className) {
      if (className[name]) {
        value += ` ${name}`
      }
    }
  }

  return value.trim()
}

/**
 * 格式化 style，将 string | object | object[] 均格式化为 object
 * @param style
 * @returns
 */
function normalizeStyle(
  style: Record<string, string> | Record<string, string>[] | string
): Record<string, string> {
  if (Array.isArray(style)) {
    const mergeStyle = {}
    for (let i = 0; i < style.length; ++i) {
      Object.assign(mergeStyle, style[i])
    }
    return mergeStyle
  } else if (isString(style)) {
    const result: Record<string, string> = {}
    const rules = style.trim().split(';').filter(Boolean)
    for (let i = 0; i < rules.length; ++i) {
      const [name, value] = rules[i].trim().split(':')
      result[name.trim()] = value.trim()
    }
    return result
  }
  return style
}

/**
 * 解析 ShapeFlag
 * @param type
 * @param children
 * @returns
 */
function normalizeShapeFlag(type: VNodeTypes, children: unknown) {
  // ShapeFlag 由两部分组成
  // 1. 节点类型
  // 2. 子节点类型

  let shapFlag: ShapeFlags = isString(type)
    ? ShapeFlags.ELEMENT
    : isPlainObject(type)
    ? ShapeFlags.STATEFUL_COMPONENT
    : isFunction(type)
    ? ShapeFlags.FUNCTIONAL_COMPONENT
    : 0

  if (isArray(children)) {
    shapFlag |= ShapeFlags.ARRAY_CHILDREN
  } else if (isPlainObject(children) || isFunction(children)) {
    shapFlag |= ShapeFlags.SLOTS_CHILDREN
  } else if (isString(children)) {
    shapFlag |= ShapeFlags.TEXT_CHILDREN
  }

  return shapFlag
}

/**
 * 解析子节点
 * @param children
 * @returns
 */
function normalizeChildren(children: any) {
  if (isFunction(children)) {
    return { default: children }
  }
  // @ts-ignore
  if (isPlainObject(children) && isFunction(children.default)) {
    // @ts-ignore
    return children.default()
  }
  return children
}

export function mergeProps(...props: Props[]): Data {
  const merged: Data = {}

  for (let i = 0; i < props.length; ++i) {
    const prop = props[i]
    if (!prop) {
      continue
    }

    for (const key in prop) {
      if (key === 'class') {
        merged.class ||= ''
        merged.class += ` ${normalizeClass(prop.class)}`
        continue
      }

      if (key === 'style') {
        merged.style ||= {}
        Object.assign(merged.style, normalizeStyle(prop.style))
        continue
      }

      if (isOn(key)) {
        if (isFunction(prop[key])) {
          if (!merged[key]) {
            merged[key] = prop[key]
          } else if (isFunction(merged[key])) {
            merged[key] = [merged[key], prop[key]]
          } else {
            merged[key].push(prop[key])
          }
        }

        continue
      }

      merged[key] = prop[key]
    }
  }

  if (merged.class) {
    merged.class = merged.class.trim()
  }

  return merged
}

/**
 * 根据子节点格式化 vNode
 * @param children 子节点
 * @returns
 */
export function normalizeVNode(children: unknown) {
  // 子节点为 null、undefined、true 或 false，均视为注释节点
  if (children == null || typeof children === 'boolean') {
    return createVNode(Comment, null, '')
  }

  // 子节点为数组，视为 Fragment
  if (isArray(children)) {
    // TODO: #3666
    return createVNode(Fragment, null, children)
  }

  // 子节点本身就是 vNode，直接穿透
  if (isVNode(children)) {
    return children
  }

  // 其余情况均视为文本节点
  return createVNode(Text, null, String(children))
}

/**
 * 克隆节点
 * @param vNode 需要克隆的节点
 * @param extraProps 额外的 props
 * @returns
 */
export function cloneVNode(vNode: VNode, extraProps: Props = null): VNode {
  const resolveKey = extraProps?.key ?? vNode.key
  const resolveProps = extraProps
    ? mergeProps(vNode.props, extraProps)
    : vNode.props

  return {
    ...vNode,

    key: resolveKey,

    props: resolveProps,
  }
}

// block 栈
const blockStack: (VNode[] | null)[] = []
// 当前开启的 block，动态节点会存储在当前 block 中
let currentBlock: VNode[] | null = null

/**
 * 开启 block 区域
 */
export function openBlock(disableTrack = false) {
  blockStack.push((currentBlock = disableTrack ? null : ([] as VNode[])))
}

/**
 * 关闭 block 区域
 */
export function closeBlock() {
  blockStack.pop()
  currentBlock = blockStack[blockStack.length - 1] || null
}

/**
 * 创建 block vnode
 * @param type
 * @param props
 * @param children
 * @returns
 */
export function createBlock(type: VNodeTypes, props: Props, children: unknown) {
  // 创建 vnode
  const vNode = createVNode(type, props, children, undefined, true)

  // 将动态节点挂载在 vnode 下
  if (currentBlock) {
    vNode.dynamicChildren = currentBlock
  }

  // 关闭当前 block
  closeBlock()

  // 关闭后若还是存在 block，则将当前创建的 vnode 存储在 block 中
  if (currentBlock && isBlockTreeEnabled > 0) {
    currentBlock.push(vNode)
  }

  return vNode
}

export let isBlockTreeEnabled = 1
export function setBlockTracking(value: number) {
  isBlockTreeEnabled = value
}

export function isSameVNodeType(n1: VNode, n2: VNode) {
  return n1.type === n2.type
}
