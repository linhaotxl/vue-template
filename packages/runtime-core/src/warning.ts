export function warn(msg: string, ...args: unknown[]) {
  const warnArgs = [`[Vue warn]: ${msg}`, ...args]
  console.warn(...warnArgs)
}
