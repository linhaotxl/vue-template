import path from 'path'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import {
  createStyleImportPlugin,
  ElementPlusResolve as StyleElementPlusResolve,
} from 'vite-plugin-style-import'
import setupExtend from 'vite-plugin-vue-setup-extend'

const root = __dirname
const resolve = (...p: string[]) => path.resolve(root, ...p)

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${resolve('src')}/`,
    },
  },

  // cacheDir: resolve('.vite'),

  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "~/styles/element/index.scss" as *;`,
      },
    },
  },

  plugins: [
    vue(),

    vueJsx(),

    unocss(),

    setupExtend(),

    AutoImport({
      include: [/\.vue$/, /\.[tj]sx?$/],

      resolvers: [
        ElementPlusResolver({
          importStyle: 'sass',
        }),
      ],

      imports: ['vue', 'vue/macros', 'vue-router', '@vueuse/core'],

      dirs: [
        './src/components/**',
        './src/directives/**',
        './src/layouts/**',
        './src/pages/**',
      ],

      dts: './src/typings/auto-imports.d.ts',

      vueTemplate: true,

      eslintrc: {
        enabled: true,
        filepath: '.eslintrc-auto-import.json',
      },
    }),

    Components({
      dirs: ['./src/components'],
      resolvers: ElementPlusResolver({
        importStyle: 'sass',
      }),
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],

      extensions: ['vue', 'tsx'],
      dts: './src/typings/components.d.ts',
      importPathTransform: path =>
        path.endsWith('.tsx') ? path.slice(0, -4) : path,
    }),

    createStyleImportPlugin({
      resolves: [StyleElementPlusResolve()],
    }),
  ],

  server: {
    proxy: {},
  },

  build: {
    assetsInlineLimit: 4096,

    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
      },
    },
  },

  optimizeDeps: {
    include: [],
  },
})
