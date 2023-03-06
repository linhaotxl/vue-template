import type { ColSize, ColSizeObject, ButtonProps } from 'element-plus'
import type { ComputedRef } from 'vue'

export type ElColProps = {
  span?: number
  offset?: number
  push?: number
  pull?: number
  xs?: ColSize
  sm?: ColSize
  md?: ColSize
  lg?: ColSize
  xl?: ColSize
}

export interface NormalizeColProps extends ColSizeObject {
  xs?: ColSizeObject
  sm?: ColSizeObject
  md?: ColSizeObject
  lg?: ColSizeObject
  xl?: ColSizeObject
}

export interface ProFormContext {
  formState: Record<string, unknown>

  formCol: ComputedRef<number | ElColProps | undefined>
}

export interface ProFormItemColSizePayload {
  prop: string
  col: NormalizeColProps | null
}

export type ProFormItemPreservePayload = string

export type ProFormBusEventPayload =
  | ProFormItemColSizePayload
  | ProFormItemPreservePayload

export type ProFormBusEventType = 'colSize' | 'preserve'

export interface Submitter {
  submitButtonText: string

  resetButtonText: string

  submitButtonProps: ButtonProps | false

  resetButtonProps: ButtonProps | false
}

export interface SubmitterSlotParams {
  values: object

  onSubmit: () => void

  onReset: () => void
}
