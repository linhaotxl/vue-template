import { camelize, capitalize } from '@vue/shared'

import { getCurrentInstance } from '../component'

import type { Component } from '../component'

/**
 * 解析组件
 * @param name 组件名
 * @returns 组件对象
 */
export function resolveComponent(name: string): Component | undefined {
  // 必须在某个组件中调用
  const instance = getCurrentInstance()
  if (!instance) {
    return
  }

  let component: Component | undefined = undefined
  let capitalName = ''
  const { components, appContext } = instance

  // 先在组件自身查找是否注册了本地组件
  component = components
    ? components[name] || components[(capitalName = capitalize(camelize(name)))]
    : undefined

  // 如果没有则在全局查找
  if (!component) {
    component =
      appContext.components[name] ||
      appContext.components[capitalName || capitalize(camelize(name))]
  }

  return component
}
