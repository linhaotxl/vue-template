import { unref } from 'vue'
import type { Ref, ComputedRef } from 'vue'

export type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

export function resolveUnref<T>(value: MaybeRef<T>) {
  return unref(value) as T
}
