// import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'

// import generatedRoutes from '~pages'

import type { RouteRecordRaw } from 'vue-router'

// const routes = setupLayouts(generatedRoutes)

const routes: RouteRecordRaw[] = [
  { path: '/', component: () => import('./pages/Dashboard.vue') },
]

export const router = createRouter({
  routes,
  history: createWebHistory(),
})
