import type { RouteRecordRedirectOption } from 'vue-router'

interface RouterConfig {
  /**
   * 导入方式
   *
   * @default 'async'
   */
  importMode?: 'sync' | 'async'

  /**
   * 重定向页面
   */
  redirect?: RouteRecordRedirectOption

  /**
   * 元数据
   */
  meta?: {
    /**
     * 所在布局组件
     *
     * @default BasicLayout
     */
    layout?: LayoutEnum
  }
}

export const enum LayoutEnum {
  BasicLayout = 'BasicLayout',
  UserLayout = 'UserLayout',
  ExceptionLayout = 'ExceptionLayout',
}

export const routerConfig: Record<string, RouterConfig> = {
  '/': {
    redirect: '/dashboard',
  },

  '/login': {
    meta: {
      layout: LayoutEnum.UserLayout,
    },
    importMode: 'sync',
  },

  '/dashboard': {
    redirect: '/dashboard/analysis',
  },

  '/:all(.*)*': {
    meta: {
      layout: LayoutEnum.ExceptionLayout,
    },
  },
}
