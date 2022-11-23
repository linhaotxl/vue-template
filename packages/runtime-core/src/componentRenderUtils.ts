import { warn } from '@vue/runtime-core'
import { EMPTY_OBJ, ShapeFlags, isOn } from '@vue/shared'

import { ErrorCodes, handleError } from './errorHandling'
import { Comment, cloneVNode, createVNode, normalizeVNode } from './vnode'

import type {
  ComponentInternalInstance,
  FunctionalComponent,
} from './component'
import type { VNode } from './vnode'

// 全局变量：是否在 render 渲染函数中访问了 $attrs
let accessedAttrs = false

/**
 * 标识在渲染函数 render 中是否访问了 $attrs
 * @param value
 */
export function markAttrsAccessed(value = true) {
  accessedAttrs = value
}

export function renderComponentRoot(
  instance: ComponentInternalInstance
): VNode {
  let result
  let fallthrough

  const {
    vNode: { shapeFlag },
    attrs,
    type: { inheritAttrs },
  } = instance

  // 每次开始渲染组件，关闭 attrsAccessed 开关
  markAttrsAccessed(false)

  try {
    if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
      // 状态组件

      // 状态组件代理对象
      const withProxy = instance.proxy!

      // 调用 render 函数渲染子节点
      result = normalizeVNode(instance.render!.call(withProxy, withProxy))

      // 状态组件会透传所有的 attrs
      fallthrough = attrs
    } else {
      // 函数组件

      // 若是没有声明 props 的函数组件，则打开 attrsAccessed 开关
      // 因为此时没有 attrs，所以不需要警告
      if (instance.props === instance.attrs) {
        markAttrsAccessed()
      }

      // 调用函数获取子节点
      result = normalizeVNode(
        (instance.type as FunctionalComponent)(instance.props, {
          get attrs() {
            // 在函数组件中访问第二个参数的 attrs 时，需要打开 attrsAccessed 开关
            markAttrsAccessed()
            return instance.attrs
          },
          emit: instance.emit,
        })
      )

      // 函数组件如果声明了 props 则会透传所有的 attrs，否则只会透传 class、style 和 eventListeners
      fallthrough =
        instance.propOptions[0] !== EMPTY_OBJ
          ? attrs
          : getFunctionalFallthrough(attrs)
    }
  } catch (e) {
    result = createVNode(Comment)
    handleError(e, ErrorCodes.RENDER_FUNCTION)
  }

  // 需要继承属性
  if (fallthrough && inheritAttrs !== false) {
    const keys = Object.keys(fallthrough)
    if (keys.length) {
      if (
        result.shapeFlag & ShapeFlags.ELEMENT ||
        result.shapeFlag & ShapeFlags.COMPONENT
      ) {
        // 只有当子节点是组件或者元素才可以继承
        result = cloneVNode(result, fallthrough)
      } else if (!accessedAttrs) {
        // 当子节点不是有效节点时，是需要抛出警告的
        // 如果在 render 中访问了 attrs 是不需要警告的，因为可能是手动设置了需要继承的节点
        let eventAttrs
        let otherAttrs
        for (const key in attrs) {
          if (isOn(key)) {
            ;(eventAttrs ||= {})[key] = attrs[key]
          } else {
            ;(otherAttrs ||= {})[key] = attrs[key]
          }
        }
        if (otherAttrs) {
          warn(
            `Extraneous non-props attributes (${Object.keys(otherAttrs).join(
              ','
            )})`
          )
        }

        if (eventAttrs) {
          warn(`Extraneous non-emits event listeners`)
        }
      }
    }
  }

  return result
}

function getFunctionalFallthrough(attrs: Record<string, any>) {
  let res: Record<string, any> | undefined

  for (const key in attrs) {
    if (key === 'class' || key === 'style' || isOn(key)) {
      ;(res ||= {})[key] = attrs[key]
    }
  }

  return res
}
