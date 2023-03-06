import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw = {
  path: '/:pathMatch(.*)*',
  name: 'NotFound',
  component: () => import('../../pages/NotFound.vue'),
}

export default routes
