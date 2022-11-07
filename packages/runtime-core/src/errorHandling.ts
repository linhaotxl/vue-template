import { warn } from './warning'

export const enum ErrorCodes {
  SCHEDULER,
  WATCH_CALLBACK,
  WATCH_CLEANUP,
  WATCH_GETTER,
}

export const ErrorTypeStrings: Record<ErrorCodes, string> = {
  [ErrorCodes.SCHEDULER]:
    'scheduler flush. This is likely a Vue internals bug. ' +
    'Please open an issue at https://new-issue.vuejs.org/?repo=vuejs/core',
  [ErrorCodes.WATCH_CALLBACK]: 'watcher callback',
  [ErrorCodes.WATCH_CLEANUP]: 'watcher cleanup',
  [ErrorCodes.WATCH_GETTER]: 'watcher getter',
}

export function callWithErrorHandling(
  fn: Function,
  code: ErrorCodes,
  args?: unknown[]
) {
  let result
  try {
    result = args ? fn(...args) : fn()
  } catch (e) {
    handleError(e, code)
  }

  return result
}

export function handleError(error: unknown, code: ErrorCodes) {
  const info = ErrorTypeStrings[code]
  warn(`Unhandler error${info ? info : ''}`)
}
