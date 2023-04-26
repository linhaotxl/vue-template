import path from 'path'

import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { FileSystemIconLoader } from 'unplugin-icons/loaders'
import IconsResolver from 'unplugin-icons/resolver'
import Icons from 'unplugin-icons/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import setupExtend from 'vite-plugin-vue-setup-extend'

const root = __dirname
const resolve = (...p: string[]) => path.resolve(root, ...p)

// icon 前缀
const ICON_PREFIX = 'i'

export default defineConfig({
  resolve: {
    alias: {
      '~/': `${resolve('src')}/`,
    },
  },

  // cacheDir: resolve('.vite'),

  // css: {
  //   preprocessorOptions: {
  //     scss: {},
  //   },
  // },

  plugins: [
    vue(),

    vueJsx(),

    unocss(),

    setupExtend(),

    AutoImport({
      include: [/\.vue$/, /\.[tj]sx?$/],

      resolvers: [
        // 自动导入组件
        ElementPlusResolver(),
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
      dirs: ['./src/components', './src/layouts'],
      resolvers: [
        // 自动注册图标组件
        IconsResolver({
          prefix: ICON_PREFIX,
          enabledCollections: ['ep', 'vis', 'ic'],
        }),

        // 自动注册组件
        ElementPlusResolver(),
      ],
      include: [/\.vue$/, /\.vue\?vue/, /\.md$/],

      extensions: ['vue', 'tsx'],
      dts: './src/typings/components.d.ts',
      importPathTransform: path =>
        path.endsWith('.tsx') ? path.slice(0, -4) : path,
    }),

    Icons({
      compiler: 'vue3',
      autoInstall: true,
      webComponents: {
        iconPrefix: ICON_PREFIX,
      },
      // 自定义 icon 集合
      customCollections: {
        vis: FileSystemIconLoader('src/assets/icons', svg =>
          svg.replace(/^<svg /, '<svg fill="currentColor" ')
        ),
      },
    }),
  ],

  server: {
    proxy: {},

    port: 2000,
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
