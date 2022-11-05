import { isFunction, isPlanObject } from '@vue/shared'

export interface ClassComponent {
  __vccOpts: object
}

export const isClassComponent = (value: any): value is ClassComponent =>
  isFunction(value) && isPlanObject(value.__vccOpts)
