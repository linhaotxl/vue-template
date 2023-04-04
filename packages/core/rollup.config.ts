import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import { defineConfig } from 'rollup'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

import type { Plugin, RollupOptions } from 'rollup'

const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url)).toString()
)

const __dirname = fileURLToPath(new URL('.', import.meta.url))

const sharedNodeOptions = defineConfig({
  output: {
    dir: path.resolve(__dirname, 'dist'),
    entryFileNames: `[name].js`,
    chunkFileNames: 'chunks/dep-[hash].js',
    exports: 'named',
    format: 'esm',
    externalLiveBindings: false,
    freeze: false,
  },
})

function createNodePlugins(): (Plugin | false)[] {
  return [
    nodeResolve({ preferBuiltins: true }),

    esbuild({
      tsconfig: './tsconfig.json',
    }),

    commonjs({
      extensions: ['.js'],
      ignore: ['bufferutil', 'utf-8-validate'],
    }),

    dts(),
  ]
}

function createNodeConfig(isProduction: boolean) {
  return defineConfig({
    input: {
      index: path.resolve(__dirname, 'src/index.ts'),
    },
    output: {
      ...sharedNodeOptions.output,
      sourcemap: !isProduction,
    },
    external: [
      'fsevents',
      ...Object.keys(pkg.dependencies),
      ...(isProduction ? [] : Object.keys(pkg.devDependencies)),
    ],
    plugins: createNodePlugins(),
  })
}

export default (commandLineArgs: any): RollupOptions[] => {
  const isDev = commandLineArgs.watch
  const isProduction = !isDev

  return defineConfig([createNodeConfig(isProduction)])
}
