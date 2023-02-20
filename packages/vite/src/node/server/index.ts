import connect from 'connect'

import {
  createDevHtmlTransformFn,
  indexHtmlMiddleware,
} from './middlewares/indexHtml'
import { serveStaticMiddleware } from './middlewares/static'
import { transformMiddleware } from './middlewares/transform'
import { createPluginContainer } from './pluginContainer'

import { resolveConfig } from '../config'
import { resolveHttpServer } from '../http'

import type { PluginContainer } from './pluginContainer'
import type { InlineConfig, ResolvedConfig } from '../config'
import type { Server as HttpServer } from 'http'

export interface ViteDevServer {
  /**
   * 解析好的配置
   */
  config: ResolvedConfig

  /**
   * 启动的 http 服务器
   */
  httpServer: HttpServer

  /**
   * 插件容器
   */
  pluginContainer: PluginContainer

  /**
   * 转换 index.html 的方法
   * @param url index.html 对应的 url，是一个去除 query 和 hash 的 url
   * @param html index.html 文件内容
   * @param originUrl index.html 对应的原始 url
   */
  transformIndexHtml(
    url: string,
    html: string,
    originUrl: string
  ): Promise<string>

  listen(port?: number): Promise<void>
}

export async function createServer(inlineConfig: InlineConfig = {}) {
  // console.log('create Server')
  const config = await resolveConfig(inlineConfig, 'serve')
  // console.log('config: ', config)

  const middlewares = connect()
  const httpServer = await resolveHttpServer(middlewares)

  // middlewares()

  const pluginContainer = createPluginContainer(config)

  const server: ViteDevServer = {
    config,
    pluginContainer,
    transformIndexHtml: null!,
    listen(port) {
      return new Promise(resolve => {
        httpServer.listen(port, () => {
          resolve()
        })
      })
    },
    httpServer,
  }

  server.transformIndexHtml = createDevHtmlTransformFn(server)

  middlewares.use(transformMiddleware(server))

  middlewares.use(serveStaticMiddleware(config.root))

  middlewares.use(indexHtmlMiddleware(server))

  // console.log(0, server)

  return server
}