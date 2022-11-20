import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import setupExtend from 'vite-plugin-vue-setup-extend'
import pages from 'vite-plugin-pages'
import layouts from 'vite-plugin-vue-layouts'
import { routerConfig } from './config/routes'
import unocss from 'unocss/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import {
  createStyleImportPlugin,
  ElementPlusResolve as StyleElementPlusResolve,
} from 'vite-plugin-style-import'

export default defineConfig({
  plugins: [
    Components({
      dirs: ['./src/components'],
      resolvers: [ElementPlusResolver()],
      extensions: ['vue', 'tsx'],
      dts: './src/components.d.ts',
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

    vue(),

    vueJsx(),

    unocss(),

    setupExtend(),

    pages({
      dirs: './src/pages',
      extensions: ['vue', 'tsx', 'jsx'],
      routeNameSeparator: '_',
      extendRoute(route) {
        return { ...route, ...routerConfig[route.path] }
      },
      importMode: path => {
        return routerConfig[path]?.importMode ?? 'async'
      },
    }),

    layouts({
      extensions: ['vue', 'tsx', 'jsx'],
      defaultLayout: 'BasicLayout',
    }),
  ],
})
