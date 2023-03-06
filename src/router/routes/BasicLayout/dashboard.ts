import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw = {
  path: '/dashboard',

  children: [
    {
      path: '/dashboard',
      name: 'DashboarAnalysis',
      component: () => import('../../../pages/Dashboard.vue'),
    },
    {
      path: '/dashboard/analysis',
      name: 'DashboardAnalysis',
      component: () => import('../../../pages/Dashboard/Analysis.vue'),
    },
    {
      path: '/dashboard/monitor',
      name: 'DashboardMonitor',
      component: () => import('../../../pages/Dashboard/Monitor'),
    },
    {
      path: '/dashboard/workspace',
      name: 'DashboardWorkspace',
      component: () => import('../../../pages/Dashboard/Workspace.vue'),
    },
  ],
}

export default routes
