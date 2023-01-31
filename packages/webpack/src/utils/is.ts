export const isString = (value: unknown): value is string =>
  typeof value === 'string'

export const isFunction = (value: unknown): value is Function =>
  typeof value === 'function'

export const isPromise = (value: unknown): value is Promise<unknown> =>
  isObject(value) && isFunction(value.then) && isFunction(value.catch)

export const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === 'object' && value !== null
