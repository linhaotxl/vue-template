import type { MaybeRef } from '../shared'
import type { UseStorageOptions, PossibleType } from '../useStorage'
import { useStorage } from '../useStorage'

export function useSessionStorage<T extends PossibleType>(
  key: string,
  defaults: MaybeRef<T>,
  options: UseStorageOptions<T> = {}
) {
  return useStorage(key, defaults, window.sessionStorage, options)
}
