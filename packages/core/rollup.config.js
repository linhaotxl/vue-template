import { readdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import resolve from '@rollup/plugin-node-resolve'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { defineConfig } from 'rollup'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = __dirname

const resolveRoot = (...p) => path.resolve(root, ...p)

const formats = ['es']

const components = readdirSync(resolveRoot('./src/components'), {
  encoding: 'utf-8',
  withFileTypes: true,
})
  .filter(assets => assets.isDirectory())
  .map(dict => dict.name)

const componentPlugins = [
  resolve({ mainFields: ['module', 'main', 'browser'] }),

  vueJsx(),

  esbuild({
    include: /\.[jt]sx?$/,
    exclude: /node_modules/,
    jsx: 'transform',
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
    tsconfig: './tsconfig.json',
  }),
]

const dtsPlugins = [
  dts({
    compilerOptions: {
      preserveSymlinks: false,
    },
    tsconfig: './tsconfig.json',
  }),
]

const createConfigs = (components, plugins, sourcemap) =>
  components.map(componentName => {
    const componentPath = resolveRoot(`./src/components/${componentName}`)
    const componentFiles = readdirSync(componentPath).map(f =>
      resolveRoot(componentPath, f)
    )

    return defineConfig({
      input: componentFiles,
      output: formats.map(format => ({
        dir: resolveRoot('./dist', format, componentName),

        format,
        sourcemap,
      })),

      external: ['vue', 'element-plus', /^dayjs/],

      plugins,
    })
  })

const configs = createConfigs(components, componentPlugins, true)
const dtsConfigs = createConfigs(components, dtsPlugins, false)

export default [...configs, ...dtsConfigs]
