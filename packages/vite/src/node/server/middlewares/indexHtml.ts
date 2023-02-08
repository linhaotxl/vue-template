import { readFileSync } from 'fs'

import { applyHtmlTransforms, resolveHtmlTransforms } from '../../plugins/html'
import { clearUrl, existsSync, resolve } from '../../utils'

import type { ViteDevServer } from '..'
import type { NextHandleFunction } from 'connect'

export function indexHtmlMiddleware(server: ViteDevServer): NextHandleFunction {
  return async function viteIndexHtmlMiddleware(req, res, next) {
    // index.html 可能带有参数（/index.html?a=2#b），先去除
    const url = req.url ? clearUrl(req.url) : ''

    if (url && url.endsWith('.html')) {
      // 获取 index.html 文件绝对路径
      const filename = getHtmlFilename(url, server)

      if (existsSync(filename)) {
        // 文件存在，则进行转换
        const html = await server.transformIndexHtml(
          url,
          readFileSync(filename, 'utf-8'),
          req.originalUrl!
        )

        // 将转换后的 html 发送给客户端
        res.end(html)
        return
      }
    }
    next()
  }
}

/**
 * 获取 url 对应的 html 文件路径
 * @param url
 * @param server
 * @returns
 */
function getHtmlFilename(url: string, server: ViteDevServer) {
  return resolve(server.config.root, url.slice(1))
}

/**
 * 创建 server.transformIndexHtml 转换函数
 * @param server
 * @returns
 */
export function createDevHtmlTransformFn(
  server: ViteDevServer
): ViteDevServer['transformIndexHtml'] {
  // 解析插件上的 transformIndexHtml hook，并按照执行时机排序
  const [preHooks, normalHooks, postHooks] = resolveHtmlTransforms(
    server.config.plugins
  )

  /**
   * server.transformIndexHtml 转换函数
   * @param url index.html 对应的 url，不会包含 query 或 hash
   * @param html index.html 文件原始内容
   * @param originalUrl index.html 对应的原始 url，可能包含 query 或 hash
   */
  return async function (url, html, originUrl) {
    return applyHtmlTransforms(
      html,
      [...preHooks, ...normalHooks, ...postHooks],
      {
        server,
        filename: getHtmlFilename(url, server),
        originUrl,
        path: url,
      }
    )
  }
}
