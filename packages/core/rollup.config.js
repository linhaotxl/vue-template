import path from 'node:path'
import { fileURLToPath } from 'node:url'

import resolve from '@rollup/plugin-node-resolve'
import { defineConfig } from 'rollup'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import vueJsx from 'unplugin-vue-jsx/rollup'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = __dirname

const resolveRoot = (...p) => path.resolve(root, ...p)

const componentsConfig = defineConfig({
  input: resolveRoot('./src/index.ts'),

  output: {
    file: resolveRoot('./dist/index.js'),
    format: 'esm',
  },

  external: ['vue', 'element-plus', '@vueuse/core'],

  plugins: [
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
  ],
})

const dtsConfig = defineConfig({
  input: resolveRoot('./src/index.ts'),

  output: {
    file: resolveRoot('./dist/index.d.ts'),
    format: 'es',
  },

  plugins: [
    dts({
      compilerOptions: {
        preserveSymlinks: false,
      },
      tsconfig: './tsconfig.json',
    }),
  ],
})

export default [componentsConfig, dtsConfig]
