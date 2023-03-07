import { isHTMLProxy } from '../../plugins/html'
import { isImportRequest, removeImportQuery, unwrapId } from '../../utils'
import { send } from '../send'
import { transformRequest } from '../transformRequest'

import type { ViteDevServer } from '..'
import type { NextHandleFunction } from 'connect'

export function transformMiddleware(server: ViteDevServer): NextHandleFunction {
  return async function viteTransformMiddleware(req, res, next) {
    let url = req.url || ''

    console.log('url: ', url)
    // 以下文件会进行转换
    // 1. html 代理文件
    // 2. 带有 ?import query 的文件（实际上是被其他文件 import 进来的）
    if (isHTMLProxy(url) || isImportRequest(url)) {
      // 移除 ?import，
      url = removeImportQuery(url)

      // 移除前缀
      url = unwrapId(url)

      // 通过 plugin 转换 url
      const result = await transformRequest(url, server)
      send(req, res, result.code, 'js')

      return
    }

    next()
  }
}
