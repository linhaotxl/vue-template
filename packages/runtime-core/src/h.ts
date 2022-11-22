import { isPlainObject, isArray, isFunction, isString } from '@vue/shared'
import { isVNode } from './vnode'
import { createVNode } from './vnode'

export function h(...args: any[]) {
  const [type, propsOrChildren, children, ...rest] = args

  if (args.length === 1) {
    return createVNode(args[0])
  }

  if (args.length === 2) {
    if (propsOrChildren && isVNode(propsOrChildren)) {
      return createVNode(type, null, [propsOrChildren])
    }

    if (isPlainObject(propsOrChildren)) {
      return createVNode(type, propsOrChildren)
    }

    if (
      isArray(propsOrChildren) ||
      isFunction(propsOrChildren) ||
      isString(propsOrChildren)
    ) {
      return createVNode(type, null, propsOrChildren)
    }

    return createVNode(type, null, propsOrChildren)
  }

  if (arguments.length === 3) {
    if (children && isVNode(children)) {
      return createVNode(type, propsOrChildren, [children])
    }

    return createVNode(type, propsOrChildren, children)
  }

  return createVNode(type, propsOrChildren, [children, ...rest])
}
