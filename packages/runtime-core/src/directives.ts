import { pauseTracking, resetTracking } from '@vue/reactivity'
import { isFunction } from '@vue/shared'

import { getCurrentInstance } from './component'
import { callWithErrorHandling, ErrorCodes } from './errorHandling'

import type { ComponentInternalInstance } from './component'
import type { ComponentPublicInstance } from './componentPublicInstance'
import type { VNode } from './vnode'

export type DirectiveModifiers = Record<string, boolean>

export interface DirectiveBinding<T = any> {
  oldValue: T
  value: T
  instance: ComponentPublicInstance | null
  arg?: string
  modifiers?: DirectiveModifiers
  dir: ObjectDirective<any, T>
}

export type DirectiveHook<T = any, V = any> = (
  el: T,
  binging: DirectiveBinding<V>,
  vNode: VNode,
  preVNode: VNode | null
) => void

export interface ObjectDirective<T = any, V = any> {
  created?: DirectiveHook<T, V>
  beforeMount?: DirectiveHook<T, V>
  mounted?: DirectiveHook<T, V>
  beforeUpdate?: DirectiveHook<T, V>
  updated?: DirectiveHook<T, V>
  beforeUnmount?: DirectiveHook<T, V>
  unmounted?: DirectiveHook<T, V>
}

export type FunctionDirective<T = any, V = any> = DirectiveHook<T, V>

export type Directive = ObjectDirective | FunctionDirective

export type DirectivesArguments = Array<
  | [Directive]
  | [Directive, any]
  | [Directive, any, string]
  | [Directive, any, string, DirectiveModifiers]
>

/**
 * 创建带有指令的 vNode
 * @param vNode vNode
 * @param directives 指令集合
 * @returns
 */
export function withDirectives(vNode: VNode, directives: DirectivesArguments) {
  let dirs = vNode.dirs
  for (let i = 0; i < directives.length; ++i) {
    const [directive, value, arg, modifiers] = directives[i]

    const resolveDir: ObjectDirective = isFunction(directive)
      ? { mounted: directive, updated: directive }
      : directive

    if (!dirs) {
      dirs = []
    }

    // 将解析好的指令数据存储在 vNode 上
    dirs.push({
      dir: resolveDir,
      // 每次创建的 value 都是这次渲染的值，在执行具体钩子时会将上一次的 value 作为 oldValue
      value,
      // 每次创建的 oldValue 都是 undefined，在执行具体的钩子函数时会设置
      oldValue: undefined,
      instance: getCurrentInstance()?.proxy ?? null,
      arg,
      modifiers,
    })
  }

  vNode.dirs = dirs

  return vNode
}

/**
 * 执行指令钩子
 * @param n1 旧 vNode
 * @param n2 新 vNode
 * @param method 钩子方法名
 * @param parent 父组件实例
 * @returns
 */
export function invokeDirectives(
  n1: VNode | null,
  n2: VNode,
  method: keyof ObjectDirective,
  parent?: ComponentInternalInstance | null
) {
  const dirs = n2.dirs
  if (!dirs) {
    return
  }

  // 遍历每一个指令
  for (let i = 0; i < dirs.length; ++i) {
    const bindings = dirs[i]
    // 从旧节点中获取对应的指令 value，作为本次的 oldValue
    bindings.oldValue = n1?.dirs?.[i].value
    if (bindings.dir[method]) {
      // 在执行 hook 前需要暂停依赖的追踪
      // hook 执行肯定是在某个组件更新过程（存在 activeEffect）中执行，如果父组件更新了，肯定会引起子组件的更新
      // 若 hook 中又访问了响应对象，那么又会追踪子组件的更新，这样子组件就会更新两次
      pauseTracking()
      callWithErrorHandling(bindings.dir[method]!, ErrorCodes.DIRECTIVE_HOOK, [
        n2.el,
        bindings,
        n2,
        n1,
      ])
      resetTracking()
    }
  }
}
