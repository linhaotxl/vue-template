import {
  camelize,
  hasOwn,
  hyphenate,
  isArray,
  isFunction,
  isModelListener,
  isOn,
  isString,
  toHandlerKey,
} from '@vue/shared'

import { ErrorCodes, callWithAsyncErrorHandling } from './errorHandling'
import { warn } from './warning'

import type { Component, ComponentInternalInstance } from './component'
import type { VNode } from './vnode'

export type ObjectEmitsOptions = Record<
  string,
  null | ((...args: unknown[]) => any)
>

export type EmitOptions = ObjectEmitsOptions | string[]

/**
 * 格式化 emits 选项，统一数据结构
 * @param vNode
 * @returns
 */
export function normalizeEmitsOptions(vNode: VNode) {
  const comp = vNode.type as Component
  const objectEmits: ObjectEmitsOptions = {}

  const { emits } = comp

  if (!emits) {
    return null
  }

  if (isArray(emits)) {
    for (let i = 0; i < emits.length; ++i) {
      objectEmits[emits[i]] = null
    }
  } else {
    for (const e in emits) {
      objectEmits[e] = emits[e]
    }
  }

  return objectEmits
}

/**
 * 检测是否是声明的事件处理器
 * @param options 事件处理器声明对象
 * @param eventName 事件名称
 * @returns
 */
export function isEmitListener(
  options: ObjectEmitsOptions | null,
  eventName: string
) {
  // 事件名称不是以 on + 首字母大写，直接返回 false 表示失败
  if (!isOn(eventName)) {
    return false
  }

  // 截取开头的 on 和结尾的 Once，保留真正的事件名
  const name = eventName.slice(2).replace(/Once$/, '')

  // 以下三个事件名只要任意一个在配置中即可
  // emits: { barQux: null, qux-bar: null, BazBar: null }
  // 1. 事件名属于驼峰；onBarQux
  // 2. 事件名属于 kabab；onQuxBar
  // 3. 事件名；onBazBar
  return options
    ? hasOwn(options, name[0].toLowerCase() + name.slice(1)) ||
        hasOwn(options, hyphenate(name)) ||
        hasOwn(options, name)
    : false
}

/**
 * 组件调用的 emit 函数
 * @param instance 组件实例
 * @param eventName 事件名
 * @param args 事件参数
 * @returns
 */
export function emit(
  instance: ComponentInternalInstance,
  eventName: string,
  ...args: unknown[]
) {
  const {
    vNode: { props },
    emitOptions,
    propOptions: [propOption],
  } = instance

  const handleKey = toHandlerKey(eventName)

  // 检查 emits 选项中是否存在触发的事件名
  const emitHasEvent = emitOptions ? hasOwn(emitOptions, eventName) : true

  // 如果 emits 中和 props 中都不存在，则抛错
  if (!emitHasEvent && !hasOwn(propOption, handleKey)) {
    warn(`Component emitted event "${eventName}" but it is neither declared`)
    return
  }

  if (emitHasEvent) {
    let validator
    if (emitOptions && isFunction((validator = emitOptions[eventName]))) {
      const res = validator(...args)
      if (res === false) {
        warn(`event validation failed for event "${eventName}"`)
        return
      }
    }
  }

  let resolveArgs = args
  if (isModelListener(handleKey)) {
    const argsName = handleKey.replace('onUpdate:', '')
    const modifiersKey =
      argsName === 'modelValue' ? 'modelModifiers' : `${argsName}Modifiers`
    if (props && hasOwn(props, modifiersKey)) {
      if (props[modifiersKey].trim === true) {
        resolveArgs = args.map(s => (isString(s) ? s.trim() : s))
      }

      if (props[modifiersKey].number === true) {
        resolveArgs = args.map(Number)
      }
    }
  }

  // 检查事件名称是否在 props 中
  const normalEventName = normalizeEventName(eventName)
  if (normalEventName) {
    const handlers = props![normalEventName]
    if (handlers) {
      callWithAsyncErrorHandling(
        handlers,
        instance,
        ErrorCodes.COMPONENT_EVENT_HANDLER,
        resolveArgs
      )
    }
  }

  // 检查 once 事件
  const onceEventName = normalizeEventName(`${eventName}Once`)
  if (
    onceEventName &&
    (!instance.emitted || !instance.emitted[onceEventName])
  ) {
    const handlers = props![onceEventName]
    if (handlers) {
      ;(instance.emitted ||= Object.create(null))[onceEventName] = true
      callWithAsyncErrorHandling(
        handlers,
        instance,
        ErrorCodes.COMPONENT_EVENT_HANDLER,
        resolveArgs
      )
    }
  }

  function normalizeEventName(eventName: string) {
    let name = ''
    if (props) {
      hasOwn(props, (name = toHandlerKey(eventName))) ||
        hasOwn(props, (name = toHandlerKey(camelize(eventName)))) ||
        hasOwn(props, (name = toHandlerKey(hyphenate(eventName))))
    }

    return name || null
  }
}
