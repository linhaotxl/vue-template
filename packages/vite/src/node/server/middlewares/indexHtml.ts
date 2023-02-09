import { readFileSync } from 'fs'

import MagicString from 'magic-string'

import {
  addToHTMLProxyCache,
  applyHtmlTransforms,
  getScriptInfo,
  resolveHtmlTransforms,
  traverseHtml,
} from '../../plugins/html'
import { clearUrl, existsSync, join, resolve } from '../../utils'

import type { ViteDevServer } from '..'
import type { ResolvedConfig } from '../../config'
import type { IndexHtmlTransformHook } from '../../plugins/html'
import type { NextHandleFunction } from 'connect'
import type { DefaultTreeAdapterMap, Token } from 'parse5'

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
      [...preHooks, devHtmlHook, ...normalHooks, ...postHooks],
      {
        server,
        filename: getHtmlFilename(url, server),
        originUrl,
        path: url,
      }
    )
  }
}

const devHtmlHook: IndexHtmlTransformHook = async (
  html,
  { server, path: htmlPath }
) => {
  const s = new MagicString(html)

  let inlineModuleIndex = 0

  // 解析 index.html 为 ast，处理每个节点
  await traverseHtml(html, node => {
    // script 节点
    if (node.nodeName === 'script') {
      const { sourceCodeLocation, src, isModule } = getScriptInfo(node)
      if (src) {
        // 存在 src 属性，则对 src 属性进行解析
        if (sourceCodeLocation) {
          processNodeUrl(src, sourceCodeLocation, s, server.config)
        }
      } else if (isModule) {
        // type 是 module，则将添加行内 script module
        addInlineModule(node, 'js')
      }
    }
  })

  /**
   * 添加行内 script module，将本身的 <script type="module"></script> 转换为 <script type="module" src="xxx"></script>
   * 其中 xxx 所指就是本来自身的代码
   * @param node
   * @param ext
   */
  function addInlineModule(node: DefaultTreeAdapterMap['element'], ext: 'js') {
    ++inlineModuleIndex

    // 获取 script 内的代码
    const codeNode = node.childNodes[0] as DefaultTreeAdapterMap['textNode']
    const code = codeNode.value

    // 重写生成的 module script url
    const modulePath = `${htmlPath}?html-proxy&index=${inlineModuleIndex}.${ext}`

    // 将 script 代码放入缓存
    addToHTMLProxyCache(server.config, htmlPath, inlineModuleIndex, { code })

    s.update(
      node.sourceCodeLocation!.startOffset,
      node.sourceCodeLocation!.endOffset,
      `<script type="module" src="${modulePath}"></script>`
    )
  }

  return {
    html: s.toString(),
    tags: [],
  }
}

// 匹配属性名和值之间的 = 以及 单/双引号
const attrValueStartRE = /=\s*(.)/

/**
 * 重写属性值
 * @param s 代码字符串
 * @param sourceCodeLocation 属性值定位节点
 * @param newValue 新值
 */
export function overwriteAttrValue(
  s: MagicString,
  sourceCodeLocation: Token.Location,
  newValue: string
) {
  // 截取需要覆盖的字符串
  const srcString = s.slice(
    sourceCodeLocation.startOffset,
    sourceCodeLocation.endOffset
  )

  // 检测是否存在 = 以及 = 后面的单/双引号
  const valueStart = srcString.match(attrValueStartRE)
  if (!valueStart) {
    throw new Error(
      `[vite:html] internal error, failed to overwrite attribute value`
    )
  }

  // 如果存在引号，则需要偏移 1
  const wrapOffset = valueStart[1] === `'` || valueStart[1] === `"` ? 1 : 0
  const valueOffset = valueStart.index! + valueStart[0].length

  // 替换内容
  s.update(
    sourceCodeLocation.startOffset + valueOffset,
    sourceCodeLocation.endOffset - wrapOffset,
    newValue
  )
}

// 匹配以 / 开头，并且之后不是 / 的内容
const startsWithSingleSlashRE = /^\/(?!\/)/

/**
 * 处理属性节点的 url
 * @param attr 属性节点
 * @param sourceCodeLocation 属性定位节点
 * @param s html 内容
 * @param config 配置对象
 */
function processNodeUrl(
  attr: Token.Attribute,
  sourceCodeLocation: Token.Location,
  s: MagicString,
  config: ResolvedConfig
) {
  const url = attr.value

  // 如果 url 是以 / 开头的，那么需要添加 base 并重写
  if (startsWithSingleSlashRE.test(url)) {
    overwriteAttrValue(s, sourceCodeLocation, join(config.base, url))
  } else {
    //
  }
}
