import sirv from 'sirv'

import { clearUrl } from '../../utils'

import type { NextHandleFunction } from 'connect'

export function serveStaticMiddleware(root: string): NextHandleFunction {
  const serve = sirv(root)

  return function viteServeStaticMiddleware(req, res, next) {
    const withoutUrl = clearUrl(req.url!)

    // 如果是 html 文件，则交由后面的中间件（indexHtmlMiddleware）处理，而不是在这直接返回 html 文件的内容
    if (withoutUrl.endsWith('.html')) {
      return next()
    }

    serve(req, res, next)
  }
}
