import path from 'path'
import { fileURLToPath } from 'url'

import commonjs from '@rollup/plugin-commonjs'
import json from '@rollup/plugin-json'
import nodeResolve from '@rollup/plugin-node-resolve'
import { defineConfig } from 'rollup'
import copy from 'rollup-plugin-copy'
import typescript from 'rollup-plugin-typescript2'

// import pkg from './package'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const base = __dirname
const resolve = (...p) => path.resolve(base, ...p)

export default defineConfig({
  input: resolve('src/index.ts'),

  output: [
    {
      format: 'commonjs',
      dir: resolve('dist'),
      entryFileNames: '[name].cjs.js',
      sourcemap: 'inline',
    },
    {
      format: 'esm',
      dir: resolve('dist'),
      entryFileNames: '[name].esm.js',
      sourcemap: 'inline',
    },
  ],

  external: [
    '@babel/generator',
    '@babel/parser',
    '@babel/traverse',
    '@babel/types',
    'tapable',
    'ejs',
    'debug',
  ],

  plugins: [
    copy({
      targets: [
        {
          src: './src/template',
          dest: './dist',
        },
      ],
    }),

    nodeResolve({}),

    typescript({
      tsconfig: resolve('tsconfig.json'),
      useTsconfigDeclarationDir: true,
    }),

    commonjs({
      // extensions: ['.js'],
      // Optional peer deps of ws. Native deps that are mostly for performance.
      // Since ws is not that perf critical for us, just ignore these deps.
      // ignore: ['bufferutil', 'utf-8-validate']
    }),

    json(),
  ],
})
