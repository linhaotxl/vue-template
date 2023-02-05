import path from 'path'

import { build } from 'esbuild'

async function bundleConfigFile(fileName: string) {
  const result = await build({
    entryPoints: [fileName],
    // 设置打包输出的文件名，仅适用于一个入口的情况，多个入口配置 outdir

    // outdir: path.resolve(process.cwd(), 'out'),
    outfile: path.resolve(process.cwd(), 'output.js'),
    // 是否将输出内容写入文件系统，写入目录为 outfile 或 outdir 配置的地方
    write: true,
    // platform: 'node',

    format: 'cjs',
  })

  // for (const out of result.outputFiles!) {
  //   console.log(out.path, out.contents, out.text)
  // }
  console.log(1)
}

export function resolveConfig() {
  bundleConfigFile(path.resolve(process.cwd(), 'vite.config.ts'))
}
