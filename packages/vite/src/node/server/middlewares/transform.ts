import { isHTMLProxy } from '../../plugins/html'
import { send } from '../send'
import { transformRequest } from '../transformRequest'

import type { ViteDevServer } from '..'
import type { NextHandleFunction } from 'connect'

export function transformMiddleware(server: ViteDevServer): NextHandleFunction {
  return async function viteTransformMiddleware(req, res, next) {
    const url = req.url || ''

    // 以下文件会进行转换
    // 1. html 代理文件
    if (isHTMLProxy(url)) {
      const result = await transformRequest(url, server)
      send(req, res, result.code, 'js')

      return
    }

    next()
  }
}
