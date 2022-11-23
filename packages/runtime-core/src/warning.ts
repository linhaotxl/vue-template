import { getCurrentInstance } from './component'
import { ErrorCodes, callWithErrorHandling } from './errorHandling'

import type { AppConfig } from './apiCreateApp'

export function warn(msg: string, ...args: unknown[]) {
  const instance = getCurrentInstance()
  if (instance) {
    let warnHandler: AppConfig['warnHandler']
    if ((warnHandler = instance.appContext.config.warnHandler)) {
      callWithErrorHandling(warnHandler, ErrorCodes.APP_WARN_HANDLER, [
        msg,
        instance.proxy,
      ])
      return
    }
  }

  const warnArgs = [`[Vue warn]: ${msg}`, ...args]
  console.warn(...warnArgs)
}
