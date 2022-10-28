import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import setupExtend from 'vite-plugin-vue-setup-extend'
import pages from 'vite-plugin-pages'
import layouts from 'vite-plugin-vue-layouts'
import { routerConfig } from './config/routes'
import unocss from 'unocss/vite'

export default defineConfig({
  plugins: [
    vue(),

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

  esbuild: {
    jsxFactory: 'h',
    jsxFragment: 'Fragment',
  },
})
