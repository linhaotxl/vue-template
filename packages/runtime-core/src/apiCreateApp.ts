import { ComponentPublicInstance } from './componentPublicInstance'
import type { Component } from './component'
import { h } from './h'
import type { RendererElement, RootRenderFunction } from './renderer'
import type { Props } from './vnode'
import { warn } from './warning'
import type { InjectionKey } from './apiInject'

export interface App<HostElement = RendererElement> {
  /**
   * 挂载方法
   * @param rootContainer 容器节点
   */
  mount(rootContainer: HostElement): void

  /**
   * 卸载方法
   */
  unmount(): void

  /**
   * 注册全局组件
   * @param name 组件名
   * @param component 组件对象
   */
  component(name: string): Component | undefined
  component(name: string, component: Component): this

  provide<T>(key: string | InjectionKey<T>, value: T): void

  /**
   * 全局作用域
   */
  ctx: AppContext

  /**
   * 全局配置
   */
  config: AppConfig
}

export interface AppConfig {
  errorHandler?: (
    error: unknown,
    instance: ComponentPublicInstance | null,
    errorInfo: string
  ) => void

  warnHandler?: (
    msg: string,
    instance: ComponentPublicInstance | null,
    trace: string
  ) => void
}

export interface AppContext {
  /**
   * 全局组件列表
   */
  components: Record<string, Component>

  /**
   * 全局 Provider
   */
  providers: Record<any, any>

  /**
   * 全局配置
   */
  config: AppConfig
}

export const genDefaultAppContext = (): AppContext => ({
  components: Object.create(null),
  config: Object.create(null),
  providers: Object.create(null),
})

export const defaultAppContext = genDefaultAppContext()

export type CreateAppFunction = (comp: Component, rootProps?: Props) => App

export function createAppAPI<
  HostElement extends RendererElement = RendererElement
>(render: RootRenderFunction<HostElement>) {
  return function createApp<
    HostElement extends RendererElement = RendererElement
  >(comp: Component, rootProps?: Props) {
    let appMounted = false

    // 创建全局作用域
    const ctx = genDefaultAppContext()

    const app: App<HostElement> = {
      ctx,

      config: ctx.config,

      mount(container) {
        if ((comp as any).__container === container) {
          // 如果根组件已经挂载过同一个容器，则抛错
          // createApp(Comp).mount(container)
          // createApp(Comp).mount(container) 抛错
          warn(`There is already an app instance mounted on the host container`)
        } else if (appMounted) {
          // 同一个 app 不能挂载多次
          // const app = createApp(Comp)
          // app.mount(container1)
          // app.mount(container2)  // 抛错
          warn(`already been mounted`)
        } else {
          // 创建根组件的 vNode
          const rootVNode = h(comp, rootProps)

          // 将全局作用域挂载在根 vNode 上，这样在之后处理组件时可以继承下去
          rootVNode.appContext = ctx

          // 从根组件开始渲染
          render(rootVNode, container as any)

          // 标识 app 已经挂在完成
          appMounted = true

          // 记录根组件挂在的容器
          ;(comp as any).__container = container
        }
      },

      unmount() {
        if (!appMounted) {
          // 卸载之前必须先挂载
          warn(`that is not mounted`)
        } else {
          render(null, (comp as any).__container)

          // 恢复两个开关变量
          appMounted = false
          ;(comp as any).__container = null
        }
      },

      component(name: string, comp?: Component): any {
        if (!comp) {
          return app.ctx.components[name]
        }

        if (app.ctx.components[name] !== undefined) {
          warn(`Component "${name}" has already been registered in target app.`)
          return this
        }

        app.ctx.components[name] = comp
        return this
      },

      provide(key, value) {
        if ((key as string) in app.ctx.providers) {
          warn(`App already provides property with key "${key}".`)
          return
        }
        app.ctx.providers[key as string] = value
      },
    }

    return app
  } as CreateAppFunction
}
