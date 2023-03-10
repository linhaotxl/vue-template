import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw = {
  path: '/dashboard',

  meta: {
    menu: {
      show: true,
      title: '首页',
    },
  },

  children: [
    {
      path: '/dashboard/panel',
      name: 'DashboarAnalysisPanel',
      component: () => import('../../../pages/Dashboard.vue'),
      meta: {
        menu: {
          show: true,
          title: '仪表盘',
        },
      },
    },

    {
      path: '/dashboard/performance',
      name: 'DashboardPerformance',
      meta: {
        menu: {
          show: true,
          title: '性能指标',
        },
      },
      children: [
        {
          path: '/dashboard/performance/analysis',
          name: 'DashboardPerformanceAnalysis',
          component: () => import('../../../pages/Dashboard/Analysis.vue'),
          meta: {
            menu: {
              show: true,
              title: '性能分析',
            },
          },
        },

        {
          path: '/dashboard/performance/monitor',
          name: 'DashboardPerformanceMonitor',
          component: () => import('../../../pages/Dashboard/Monitor'),
          meta: {
            menu: {
              show: true,
              title: '性能监控',
            },
          },
        },
      ],
    },

    {
      path: '/dashboard/workspace',
      name: 'DashboardWorkspace',
      component: () => import('../../../pages/Dashboard/Workspace.vue'),
      meta: {
        menu: {
          show: true,
          title: '工作空间',
        },
      },
    },
  ],
}

export default routes
