import type { Ref, Slot, Slots } from 'vue'

export function collectSlots(slots: Slots, names: string | string[]) {
  const targetSlots: Record<string, Slot> = {}
  const slotNames = Array.isArray(names) ? names : [names]

  for (const name of slotNames) {
    if (slots[name]) {
      targetSlots[name] = (...args: unknown[]) => slots[name]!(...args)
    }
  }

  return targetSlots
}

export function collectComponentMethods<T>(methods: string[], ref: Ref<T>) {
  const methodsMap: Record<string, (...args: unknown[]) => void> = {}

  for (const method of methods) {
    methodsMap[method] = function (...args) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (ref.value as any)[method](...args)
    }
  }

  return methodsMap
}

export const toPropBooleanValue = (
  props: Record<string, unknown>,
  name: string
) => {
  let result = false
  const resultValue = props[name]
  if (resultValue === '' || resultValue === true) {
    result = true
  }
  return result
}
