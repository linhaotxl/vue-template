import type { IncomingMessage, ServerResponse } from 'http'

const alias: Record<string, string> = {
  js: 'application/javascript',
}

export function send(
  req: IncomingMessage,
  res: ServerResponse,
  content: string,
  type: 'js'
) {
  res.setHeader('Content-Type', alias[type || 'js'])
  res.statusCode = 200
  res.end(content)
}
