import type { ComponentInternalInstance } from './component'
import { Comment, createVNode, normalizeVNode, VNode } from './vnode'

export function renderComponentRoot(
  instance: ComponentInternalInstance
): VNode {
  let result

  const { render, proxy } = instance

  const withProxy = proxy!

  try {
    result = normalizeVNode(render!.call(withProxy, withProxy))
  } catch (e) {
    result = createVNode(Comment)
  }

  return result
}
