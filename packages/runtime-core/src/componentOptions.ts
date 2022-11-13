import { ComponentPropsOptions } from './componentProps'
import type { VNode } from './vnode'

export type RenderFunction = () => VNode

export type ComponentOptions<Props, RawBindings> = ComponentOptionsBase<
  Props,
  RawBindings
>

export interface ComponentOptionsBase<Props, RawBindings>
  extends LegacyOptions {
  name?: string

  props?: ComponentPropsOptions<Props>

  setup?: () => RenderFunction | RawBindings

  render?: Function
}

export interface LegacyOptions {
  data?: () => unknown
}
