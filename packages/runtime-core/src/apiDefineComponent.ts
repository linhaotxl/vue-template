import type { Component } from './component'

export function defineComponent(options: unknown) {
  return options as Component
}
