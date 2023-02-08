import type { Server } from 'connect'
import type { Server as HttpServer } from 'node:http'

export async function resolveHttpServer(app: Server): Promise<HttpServer> {
  const { createServer } = await import('node:http')
  return createServer(app)
}
