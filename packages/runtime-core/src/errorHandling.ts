import { AppConfig } from './apiCreateApp'
import { getCurrentInstance, LifecycleHooks } from './component'
import { warn } from './warning'

export const enum ErrorCodes {
  SCHEDULER,
  WATCH_CALLBACK,
  WATCH_CLEANUP,
  WATCH_GETTER,
  SETUP_FUNCTION,
  RENDER_FUNCTION,
  APP_WARN_HANDLER,
}

export type ErrorTypes = ErrorCodes | LifecycleHooks

export const ErrorTypeStrings: Record<ErrorTypes, string> = {
  [ErrorCodes.SCHEDULER]:
    'scheduler flush. This is likely a Vue internals bug. ' +
    'Please open an issue at https://new-issue.vuejs.org/?repo=vuejs/core',
  [ErrorCodes.WATCH_CALLBACK]: 'watcher callback',
  [ErrorCodes.WATCH_CLEANUP]: 'watcher cleanup',
  [ErrorCodes.WATCH_GETTER]: 'watcher getter',
  [ErrorCodes.SETUP_FUNCTION]: 'setup function',
  [ErrorCodes.RENDER_FUNCTION]: 'render function',
  [ErrorCodes.APP_WARN_HANDLER]: 'app warnHandler',

  [LifecycleHooks.BEFORE_CREATE]: 'beforeCreate hook',
  [LifecycleHooks.CREATED]: 'created hook',
  [LifecycleHooks.BEFORE_MOUNT]: 'beforeMount hook',
  [LifecycleHooks.MOUNTED]: 'mouted hook',
  [LifecycleHooks.BEFORE_UPDATE]: 'beforeUpdate hook',
  [LifecycleHooks.UPDATED]: 'updated hook',
  [LifecycleHooks.BEFORE_UNMOUNT]: 'beforeUnmount hook',
  [LifecycleHooks.UNMOUNTED]: 'unmounted hook',
}

export function callWithErrorHandling(
  fn: Function,
  code: ErrorTypes,
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

export function handleError(error: unknown, code: ErrorTypes) {
  const info = ErrorTypeStrings[code]
  const instance = getCurrentInstance()
  let errorHandler: AppConfig['errorHandler']

  if (instance) {
    if ((errorHandler = instance.appContext.config.errorHandler)) {
      errorHandler(error, instance.proxy, info)
      return
    }
  }

  warn(`Unhandler error${info ? info : ''}`)
}
