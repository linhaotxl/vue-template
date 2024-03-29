import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw = {
  path: '/login',
  name: 'Login',
  component: () => import('../../../pages/Login.vue'),
}

export default routes
