// import { setupLayouts } from 'virtual:generated-layouts'
import { createRouter, createWebHistory } from 'vue-router'

// import generatedRoutes from '~pages'

import type { RouteRecordRaw } from 'vue-router'

// const routes = setupLayouts(generatedRoutes)

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'BasicLayout',
    component: () => import('./layouts/BasicLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('./pages/Dashboard.vue'),
      },
    ],
  },
]

export const router = createRouter({
  routes,
  history: createWebHistory(),
})
