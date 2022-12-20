import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
// import { routerConfig } from './config/routes'
import unocss from 'unocss/vite'
import AutoImport from 'unplugin-auto-import/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import Components from 'unplugin-vue-components/vite'
import { defineConfig } from 'vite'
import pages from 'vite-plugin-pages'
import {
  createStyleImportPlugin,
  ElementPlusResolve as StyleElementPlusResolve,
} from 'vite-plugin-style-import'
import layouts from 'vite-plugin-vue-layouts'
import setupExtend from 'vite-plugin-vue-setup-extend'

export default defineConfig({
  plugins: [
    vue(),

    vueJsx(),

    unocss(),

    setupExtend(),

    pages({
      dirs: './src/pages',
      extensions: ['vue', 'tsx', 'jsx'],
      routeNameSeparator: '_',
      // extendRoute(route) {
      //   return { ...route, ...routerConfig[route.path] }
      // },
      // importMode: path => {
      //   return routerConfig[path]?.importMode ?? 'async'
      // },
    }),

    layouts({
      extensions: ['vue', 'tsx', 'jsx'],
      defaultLayout: 'BasicLayout',
    }),

    AutoImport({
      include: [/\.vue$/, /\.[tj]sx?$/],

      resolvers: [ElementPlusResolver()],

      imports: ['vue', 'vue/macros', 'vue-router', '@vueuse/core'],

      dirs: [
        './src/components',
        './src/directives',
        './src/layouts',
        './src/pages',
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
      resolvers: [ElementPlusResolver()],
      extensions: ['vue', 'tsx'],
      dts: './src/typings/components.d.ts',
      importPathTransform: path =>
        path.endsWith('.tsx') ? path.slice(0, -4) : path,
    }),

    createStyleImportPlugin({
      resolves: [StyleElementPlusResolve()],
      libs: [
        {
          esModule: true,
          libraryName: 'element-plus',
          resolveStyle: name => `element-plus/theme-chalk/${name}.css`,
        },
      ],
    }),
  ],
})
