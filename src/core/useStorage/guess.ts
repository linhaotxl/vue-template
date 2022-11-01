import { toRawType } from '../shared'
import type { StorageSerializersType } from './useStorage'

const typeMap: Record<string, StorageSerializersType> = {
  String: 'string',
  Number: 'number',
  Boolean: 'boolean',
  Set: 'set',
  Map: 'map',
  Date: 'date',
  Object: 'object',
  Array: 'object',
}

export function guessType(value: unknown) {
  const type = toRawType(value)
  return typeMap[type] || 'all'
}
