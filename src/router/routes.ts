import type { RouteRecordRaw } from 'vue-router'

const Layouts = import.meta.glob('../layouts/**/*.{vue,jsx,tsx}')
const Routes: Record<string, { default: RouteRecordRaw | RouteRecordRaw[] }> =
  import.meta.glob('./routes/**/*.{js,ts}', { eager: true })

const normalizeLayoutName = (name: string) =>
  name[0].toUpperCase() +
  name.slice(1).replace(/-([a-z])/g, (_, char) => `${char.toUpperCase()}`)

const LayoutImportMap = Object.entries(Layouts).reduce<
  Record<string, () => Promise<unknown>>
>((prev, [layoutPath, layoutImport]) => {
  let layoutName
  let layoutMatch = layoutPath.match(
    /layouts\/([^/]+)\/index\.(?:vue|(?:j|t)sx)/
  )
  if (layoutMatch) {
    layoutName = normalizeLayoutName(layoutMatch[1])
  } else if (
    (layoutMatch = layoutPath.match(/layouts\/([\w-]+)\.(?:vue|(?:j|t)sx)/))
  ) {
    layoutName = normalizeLayoutName(layoutMatch[1])
  }

  if (layoutName) {
    prev[layoutName] = layoutImport
  }
  return prev
}, {})

const scanRoutes = Object.entries(Routes).reduce<RouteRecordRaw[]>(
  (prev, [routePath, { default: routeDefault }]) => {
    const layoutMatch = routePath.match(
      /routes\/(.+)\/(?:.+\.(?:m|c)?(?:j|t)sx?)/
    )

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
