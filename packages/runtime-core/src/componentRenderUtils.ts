import { ShapeFlags } from '@vue/shared'
import type { ComponentInternalInstance } from './component'
import type { RenderFunction } from './componentOptions'
import { Comment, createVNode, normalizeVNode } from './vnode'
import type { VNode } from './vnode'
import { ErrorCodes, handleError } from './errorHandling'

export function renderComponentRoot(
  instance: ComponentInternalInstance
): VNode {
  let result

  const {
    render,
    proxy,
    vNode: { shapeFlag },
  } = instance

  const withProxy = proxy!

  try {
    if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      result = normalizeVNode(render!.call(withProxy, withProxy))
    } else {
      result = normalizeVNode((instance.type as RenderFunction)())
    }
  } catch (e) {
    result = createVNode(Comment)
    handleError(e, ErrorCodes.RENDER_FUNCTION)
  }

  return result
}
