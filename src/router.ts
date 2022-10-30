import { createRouter, createWebHistory } from 'vue-router'
import { setupLayouts } from 'virtual:generated-layouts'
import generatedRoutes from '~pages'

const routes = setupLayouts(generatedRoutes)

console.log(routes)

export const router = createRouter({
  routes,
  history: createWebHistory(),
})
