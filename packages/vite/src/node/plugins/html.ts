import { isArray, isBoolean, isObject, isString } from '../utils'

import type { Plugin } from '../plugin'
import type { ViteDevServer } from '../server'

/**
 * Plugin 上转换 index.html hook 的类型
 */
export type IndexHtmlTransform =
  | IndexHtmlTransformHook
  | {
      /**
       * 转换 hook 执行时机
       */
      order?: 'pre' | 'post'

      /**
       * 转换 hook 函数
       */
      handler: IndexHtmlTransformHook
    }

/**
 * 描述 html 标签的对象
 */
export interface HtmlTagDescriptor {
  /**
   * 标签名
   */
  tag: string

  /**
   * 子节点
   */
  children?: HtmlTagDescriptor[] | string

  /**
   * 属性集合
   */
  attrs?: Record<string, unknown>

  /**
   * 插入位置；head 尾部、head 头部、body 尾部以及 body 头部
   *
   * @default 'head-prepend'
   */
  injectTo?: 'head' | 'body' | 'head-prepend' | 'body-prepend'
}

/**
 * Plugin 上转换 index.htm hook 函数返回的类型
 */
export type IndexHtmlTransformResult =
  | string
  | HtmlTagDescriptor[]
  | {
      html: string
      tags: HtmlTagDescriptor[]
    }

/**
 * Plugin 上转换 index.html hook 的函数类型
 */
export type IndexHtmlTransformHook = (
  html: string,
  ctx: IndexHtmlTransformContext
) => IndexHtmlTransformResult | void | Promise<IndexHtmlTransformResult | void>

/**
 * Plugin 上转换 index.html hook 的作用域参数
 */
export interface IndexHtmlTransformContext {
  /**
   * index.html 的绝对路径
   */
  filename: string

  /**
   * vite 服务配置
   */
  server: ViteDevServer

  /**
   * index.html 原始 url
   */
  originUrl: string

  /**
   * index.html url，是一个去除 query 和 hash 的 url
   */
  path: string
}

/**
 * 调用 index.html 的 transform hook
 * @param html html 文件原始内容
 * @param hooks 所有的 hook 列表
 * @returns 转换后的 html 内容
 */
export async function applyHtmlTransforms(
  html: string,
  hooks: IndexHtmlTransformHook[],
  ctx: IndexHtmlTransformContext
) {
  // 遍历每一个 hook
  for (const hook of hooks) {
    // 异步执行 hook，如果没有返回值则不需要再处理
    const res = await hook(html, ctx)
    if (!res) {
      continue
    }

    // 返回的是字符串，直接覆盖 html 内容
    if (isString(res)) {
      html = res
    } else {
      const headTags: HtmlTagDescriptor[] = []
      const headPrependTags: HtmlTagDescriptor[] = []
      const bodyTags: HtmlTagDescriptor[] = []
      const bodyPrependTags: HtmlTagDescriptor[] = []

      let tags: HtmlTagDescriptor[]
      if (isArray(res)) {
        // 返回的是数组，表示标签列表
        tags = res
      } else {
        // 返回的是对象，tags 是标签列表，html 是内容
        tags = res.tags
        html = res.html || html
      }

      // 遍历每一个标签，根据插入位置放进不同数组中
      for (const tag of tags) {
        if (tag.injectTo === 'body') bodyTags.push(tag)
        else if (tag.injectTo === 'body-prepend') bodyPrependTags.push(tag)
        else if (tag.injectTo === 'head') headTags.push(tag)
        else if (tag.injectTo === 'head-prepend') headPrependTags.push(tag)
        else headPrependTags.push(tag)
      }

      // 依次插入不同位置的标签
      html = injectToHead(html, headPrependTags, true)
      html = injectToHead(html, headTags, false)
      html = injectToBody(html, bodyPrependTags, true)
      html = injectToBody(html, bodyTags, false)
    }
  }

  // 返回最终的 html 代码
  return html
}

/**
 * 解析插件转换 index.html 的 hook
 * @param plugins
 * @returns 按照 hook 执行顺序组成的元组
 */
export function resolveHtmlTransforms(
  plugins: Plugin[]
): [
  IndexHtmlTransformHook[],
  IndexHtmlTransformHook[],
  IndexHtmlTransformHook[]
] {
  const preHooks: IndexHtmlTransformHook[] = []
  const normalHooks: IndexHtmlTransformHook[] = []
  const postHooks: IndexHtmlTransformHook[] = []

  for (const plugin of plugins) {
    const hook = plugin.transformIndexHtml
    if (!hook) {
      continue
    }

    if (isObject(hook)) {
      if (hook.order === 'pre') {
        preHooks.push(hook.handler)
      } else if (hook.order === 'post') {
        postHooks.push(hook.handler)
      } else {
        normalHooks.push(hook.handler)
      }
    } else {
      normalHooks.push(hook)
    }
  }

  return [preHooks, normalHooks, postHooks]
}

/**
 * 序列化标签属性
 * @param attrs 属性集合
 * @returns 属性字符串
 */
function serializeAttrs(attrs: HtmlTagDescriptor['attrs']) {
  let res = ''

  if (!attrs) {
    return res
  }

  for (const attr in attrs) {
    const value = attrs[attr]
    if (isBoolean(value)) {
      res += value ? ` ${attr}` : ''
    } else {
      res += ` ${attr}=${JSON.stringify(value)}`
    }
  }

  return res
}

/**
 * 序列化多个标签
 * @param tags 多个标签
 * @returns 多个标签字符串
 */
function serializeTags(tags: HtmlTagDescriptor['children'], indent: string) {
  if (!tags) {
    return ''
  }

  if (isString(tags)) {
    return `${indent}${tags}`
  }

  return tags.map(tag => indent + serializeTag(tag, indent)).join(`\n`)
}

/**
 * 序列化单个的标签
 * @param tag 标签对象
 * @returns 标签字符串
 */
function serializeTag(
  { tag, children, attrs }: HtmlTagDescriptor,
  indent: string
): string {
  return `<${tag}${serializeAttrs(attrs)}>\n${serializeTags(
    children,
    incrementIndent(indent)
  )}\n${indent}</${tag}>`
}

const headPrependInjectRE = /([ \t]*)<head[^>]*>/i
const headInjectRE = /([ \t]*)<\/head[^>]*>/i
const bodyPrependInjectRE = /([ \t]*)<body[^>]*>/i
const bodyInjectRE = /([ \t]*)<\/body[^>]*>/i

/**
 * 注入自定义标签到 head 内
 * @param html 原始 html 内容
 * @param tags 自定义标签列表
 * @param prepend 是否插入 head 头部
 * @returns 注入后的 html 代码
 */
function injectToHead(
  html: string,
  tags: HtmlTagDescriptor[],
  prepend: boolean
) {
  // 没有自定义标签，直接返回原始 html 内容
  if (tags.length === 0) {
    return html
  }

  // 插入 head 头部，检测是否存在 <head> 开始标签，有的话将自定义标签写在 <head> 后
  if (prepend) {
    if (headPrependInjectRE.test(html)) {
      html = html.replace(headPrependInjectRE, (head, indent) => {
        return `${head}\n${serializeTags(tags, incrementIndent(indent))}`
      })
    }

    return html
  }

  // 插入 head 尾部，检测是否存在 </head> 结束标签，有的话将自定义标签写在 </head> 前
  if (headInjectRE.test(html)) {
    html = html.replace(headInjectRE, (head, indent) => {
      return `${serializeTags(tags, incrementIndent(indent))}\n${head}`
    })
  }

  // 返回最终的 html 内容
  return html
}

/**
 * 注入自定义标签到 head 内
 * @param html 原始 html 内容
 * @param tags 自定义标签列表
 * @param prepend 是否插入 head 头部
 * @returns 注入后的 html 代码
 */
function injectToBody(
  html: string,
  tags: HtmlTagDescriptor[],
  prepend: boolean
) {
  // 没有自定义标签，直接返回原始 html 内容
  if (tags.length === 0) {
    return html
  }

  // 插入 body 头部，检测是否存在 <body> 开始标签，有的话将自定义标签写在 <body> 后
  if (prepend) {
    if (bodyPrependInjectRE.test(html)) {
      html = html.replace(bodyPrependInjectRE, (body, indent) => {
        return `${body}\n${serializeTags(tags, incrementIndent(indent))}`
      })
    }

    return html
  }

  // 插入 body 尾部，检测是否存在 </body> 结束标签，有的话将自定义标签写在 </body> 前
  if (bodyInjectRE.test(html)) {
    html = html.replace(bodyInjectRE, (body, indent) => {
      return `${serializeTags(tags, incrementIndent(indent))}\n${body}`
    })
  }

  // 返回最终的 html 内容
  return html
}

/**
 * 增加缩进
 * @param indent
 * @returns
 */
function incrementIndent(indent: string) {
  return `${indent}${indent[0] === '\t' ? '\t' : '  '}`
}
