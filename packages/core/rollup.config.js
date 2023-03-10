import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { nodeResolve } from '@rollup/plugin-node-resolve'
import { defineConfig } from 'rollup'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = __dirname

const resolveRoot = (...p) => path.resolve(root, ...p)

const componentsConfig = defineConfig({
  input: resolveRoot('./src/components/index.ts'),

  output: {
    file: resolveRoot('./dist/index.js'),
    format: 'esm',
  },

  external: ['vue', 'element-plus', '@vueuse/core'],

  plugins: [
    nodeResolve(),

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
  input: resolveRoot('./src/components/index.ts'),

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
