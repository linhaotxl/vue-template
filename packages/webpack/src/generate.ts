import type { Chunk } from './typings'

/**
 * 创建代码块的代码
 * @param chunk
 * @returns
 */
export function generateChunkCode(chunk: Chunk) {
  const code = `
var cache = {}

// require 函数实现
function require(moduleId) {
  if (cache[moduleId]) {
    return cache[moduleId].exports
  }

  var module = (cache[moduleId] = { exports: {} })
  modules[moduleId](module, module.exports, require)

  return module.exports
}

// 依赖模块集合
var modules = {
  ${chunk.dependenceModules.map(
    module => `\n'${module.id}': (module, exports) => {
    ${module.sourceCode}
  }`
  )}
}

// 入口代码
;(() => {
  ${chunk.entryModule.sourceCode}
})()

  `.trim()

  return code
}
