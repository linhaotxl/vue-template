import { computed, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { MaybeRef, resolveUnref } from '../shared'

export interface UseElementByPointOptions {
  x: MaybeRef<number>

  y: MaybeRef<number>
}

export interface UseElementByPointReturn {
  element: Ref<Element | null>
}

export function useElementByPoint(
  options: UseElementByPointOptions
): UseElementByPointReturn {
  const { x, y } = options
  const element = ref<Element | null>(null)

  const resolveX = computed(() => resolveUnref(x))
  const resolveY = computed(() => resolveUnref(y))

  watch([resolveX, resolveY], ([_x, _y]) => {
    element.value = document.elementFromPoint(_x, _y)
  })

  return {
    element,
  }
}
