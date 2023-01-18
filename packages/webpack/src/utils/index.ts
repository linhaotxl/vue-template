export * from './is'
export * from './path'
export * from './file'

export const extractWebpackChunkName = (rawId: string) =>
  /\s*webpackChunkName:\s*['"](\w+)['"]/.exec(rawId)?.[1] ?? undefined
