import { isFunction, ShapeFlags } from '@vue/shared'

import { isArray } from './../../shared/src/index'
import { normalizeVNode } from './vnode'
import { warn } from './warning'

import type { ComponentInternalInstance } from './component'
import type { VNode } from './vnode'

export type RawSlots = {
  [x: string]: unknown

  _: any
}

export type Slot = (...args: unknown[]) => VNode[]

export type InternalSlots = {
  [x: string]: Slot
}

const isInternalKey = (key: string) => key[0] === '_'

export function initSlots(instance: ComponentInternalInstance) {
  const { vNode } = instance
  const slots: InternalSlots = {}
  const rawSlots = vNode.children as RawSlots

  if (!(vNode.shapeFlag & ShapeFlags.SLOTS_CHILDREN)) {
    // children 不为对象或函数，可能是数组
    warn(
      `Non-function value encountered for default slot. Prefer function slots for better performance.`
    )
    slots.default = () => normalizeSlotValue(rawSlots)
  } else {
    // children 是对象或函数
    normalizeObjectSlots(rawSlots, slots)
  }

  instance.slots = slots
}

export function normalizeObjectSlots(rawSlots: RawSlots, slots: InternalSlots) {
  for (const key in rawSlots) {
    const slotValue = rawSlots[key]

    if (isInternalKey(key) || slotValue == null) {
      continue
    }

    if (!isFunction(slotValue)) {
      warn(
        `Non-function value encountered for slot "${key}". Prefer function slots for better performance.`
      )
      slots[key] = () => normalizeSlotValue(slotValue)
    } else {
      slots[key] = normalizeSlot(slotValue)
    }
  }
}

export function normalizeSlotValue(value: unknown) {
  return isArray(value) ? value.map(normalizeVNode) : [normalizeVNode(value)]
}

export function normalizeSlot(rawFunction: Function) {
  return () => normalizeSlotValue(rawFunction())
}
