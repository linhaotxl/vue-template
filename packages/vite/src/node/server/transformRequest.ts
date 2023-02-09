import { isString } from '../utils'

import type { ViteDevServer } from '.'

export interface TransformResult {
  code: string
}

export async function transformRequest(rawId: string, server: ViteDevServer) {
  const result = await doTransform(rawId, server)

  return result
}

export async function doTransform(rawId: string, server: ViteDevServer) {
  const id = (await server.pluginContainer.resolveId(rawId))?.id ?? rawId

  const result = await loadAndTransform(id, server)

  return result
}

async function loadAndTransform(id: string, server: ViteDevServer) {
  const { pluginContainer } = server

  let code: string

  // load
  const loadResult = await pluginContainer.load(id)
  if (loadResult) {
    if (isString(loadResult)) {
      code = loadResult
    } else {
      code = loadResult.code
    }
  }

  // transform
  const transformResult = await pluginContainer.transform(code!, id)
  if (transformResult) {
    code = transformResult.code
  }

  const result: TransformResult = {
    code: code!,
  }

  return result
}
