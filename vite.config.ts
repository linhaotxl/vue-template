import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import setupExtend from 'vite-plugin-vue-setup-extend'
import pages from 'vite-plugin-pages'
import layouts from 'vite-plugin-vue-layouts'
import { routerConfig } from './config/routes'

export default defineConfig({
  plugins: [
    vue(),

    setupExtend(),

    pages({
      dirs: './src/pages',
      extensions: ['vue', 'tsx', 'jsx'],
      routeNameSeparator: '_',
      extendRoute(route) {
        // console.log(route.path)
        return { ...route, ...routerConfig[route.path] }
      },
      importMode: path => {
        // console.log(1, path, root)
        return routerConfig[path]?.importMode ?? 'async'
      },
      // onRoutesGenerated(routes) {
      //   // console.log('routes: ', routes)
      //   return routes
      // },
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
