import debug from 'debug'

// export const log = (...args: unknown[]) => console.log('[info]: ', ...args)

type DebugScope = `my-webpack:${string}`

export function createDebugger(namespace: DebugScope) {
  const log = debug(namespace)

  return log
}
