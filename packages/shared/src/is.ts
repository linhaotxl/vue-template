const objectToString = Object.prototype.toString
const toTypeString = (value: unknown): string => objectToString.call(value)
const toType = (value: unknown) => toTypeString(value).slice(8, -1)

export const isArray = Array.isArray

export const isString = (value: unknown): value is string =>
  typeof value === 'string'
export const isFunction = (value: unknown): value is Function =>
  typeof value === 'function'
export const isBoolean = (value: unknown): value is boolean =>
  typeof value === 'boolean'

export const isNumber = (value: unknown): value is number =>
  typeof value === 'number'

export const isPlanObject = (value: unknown): value is Record<string, any> =>
  toType(value) === 'Object'

export const onRE = /^on[A-Z+]/
export const isOn = (value: string) => onRE.test(value)
