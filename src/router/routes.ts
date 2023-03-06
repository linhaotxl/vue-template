import type { RouteRecordRaw } from 'vue-router'

const Layouts = import.meta.glob('../layouts/**')
const Routes: Record<string, { default: RouteRecordRaw | RouteRecordRaw[] }> =
  import.meta.glob('./routes/**', { eager: true })

const normalizeLayoutName = (name: string) =>
  name[0].toUpperCase() +
  name.slice(1).replace(/-([a-z])/g, (_, char) => `${char.toUpperCase()}`)

const LayoutImportMap = Object.entries(Layouts).reduce<
  Record<string, () => Promise<unknown>>
>((prev, [layoutPath, layoutImport]) => {
  const layoutMatch = layoutPath.match(
    /layouts\/(\w+)\.(?:vue|(?:m|c)?(?:j|t)sx?)/
  )
  if (layoutMatch) {
    const layoutName = normalizeLayoutName(layoutMatch[1])
    prev[layoutName] = layoutImport
  }
  return prev
}, {})

const scanRoutes = Object.entries(Routes).reduce<RouteRecordRaw[]>(
  (prev, [routePath, routeModule]) => {
    const layoutMatch = routePath.match(
      /routes\/(.+)\/(?:.+\.(?:m|c)?(?:j|t)sx?)/
    )

    const routeDefault = routeModule.default
    const routeChildren = Array.isArray(routeDefault)
      ? routeDefault
      : [routeDefault]

    if (layoutMatch) {
      const layoutName = normalizeLayoutName(layoutMatch[1])

      prev.push({
        component: LayoutImportMap[layoutName],
        children: routeChildren,
        path: '/',
      })
    } else {
      prev.push(...routeChildren)
    }
    return prev
  },
  []
)

export const routes = [...scanRoutes]
