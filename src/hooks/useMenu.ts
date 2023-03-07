import type { RouteRecordRaw } from 'vue-router'

export interface MenuOption {
  title: string
  name: string
  // icon: string
  children?: MenuOption[]
}

export function useMenu() {
  // 记录每个 menu item 需要展开的父级 menu 路径
  // key: menu item 对应的路由 path
  // value: menu item 向上展开的路径 id
  const openedMap = Object.create(null)

  // 扫描出所有的路由
  const menus = Object.entries<{ default: RouteRecordRaw | RouteRecordRaw[] }>(
    import.meta.glob('../router/routes/**/*.{js,ts}', { eager: true })
  ).reduce<MenuOption[]>((prev, [, { default: routeModule }]) => {
    // 将扫描出的路由对象格式化后依次存入 prev 中
    if (Array.isArray(routeModule)) {
      routeModule.reduce((prev, curr) => {
        accumulateRoute(curr, prev, openedMap)
        return prev
      }, prev)
    } else {
      accumulateRoute(routeModule, prev, openedMap)
    }

    return prev
  }, [])

  const route = useRoute()
  const defaultOpeneds = ref<string[]>(openedMap[route.path])
  const defaultActive = ref<string>(route.path)

  return { menus, defaultActive, defaultOpeneds }
}

/**
 * 格式化 route 对象并累加
 * @param r route 对象
 * @param target 需要累加的数组
 * @param openedMap 记录 item 需要展开的父级路径
 */
function accumulateRoute(
  r: RouteRecordRaw,
  target: MenuOption[],
  openedMap: Record<string, string[] | undefined>
) {
  const menuOpt = normalizeRouteMenuOption(r, [], openedMap)
  menuOpt && target.push(menuOpt)
}

/**
 * 格式化 route 对象
 * @param route route 对象
 * @param parentPath route 所在的父级路径
 * @param openedMap 记录 item 需要展开的父级路径
 * @returns
 */
function normalizeRouteMenuOption(
  route: RouteRecordRaw,
  parentPath: string[],
  openedMap: Record<string, string[] | undefined>
): MenuOption | undefined {
  // 获取路由的 menu 配置，过滤不需要显示菜单的路由
  let menuOption
  if ((menuOption = route.meta?.menu) && menuOption.show) {
    let children!: MenuOption[]
    if (route.children) {
      // 继续格式化子路由，此时路径为当前的父级路径 + 当前路由的路径
      children = route.children.reduce<MenuOption[]>((prev, childRoute) => {
        const childMenu = normalizeRouteMenuOption(
          childRoute,
          [...parentPath, route.path],
          openedMap
        )
        if (childMenu) {
          prev.push(childMenu)
        }
        return prev
      }, [])
    }

    // 没有子节点的路由（对应 menu-item）才需要记录父级路径
    if (!children) {
      ;(openedMap[route.path] ||= []).push(...parentPath)
    }

    // 返回格式化好的对象
    return {
      title: menuOption.title,
      // icon: menuOption.icon,
      name: route.path,
      children,
    }
  }
}
