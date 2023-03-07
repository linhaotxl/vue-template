import 'vue-router'

declare module 'vue-router' {
  interface RouteMeta {
    menu?: {
      show: boolean
      title: string
      icon?: string
    }
  }
}
