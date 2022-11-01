import type { MaybeRef } from '../shared'
import type { UseStorageOptions, PossibleType } from '../useStorage'
import { useStorage } from '../useStorage'

export function useLocalStorage<T extends PossibleType>(
  key: string,
  defaults: MaybeRef<T>,
  options: UseStorageOptions<T> = {}
) {
  return useStorage(key, defaults, window.localStorage, options)
}
