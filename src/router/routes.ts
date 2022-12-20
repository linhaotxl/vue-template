import { createRouter, createWebHistory } from 'vue-router'

import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  { path: '/', component: import('../pages/Dashboard.vue') },
]

export const rotuer = createRouter({
  routes,
  history: createWebHistory(),
})
