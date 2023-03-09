import { ElButton, ElCol, ElFormItem } from 'element-plus'
import { computed, provide, reactive, ref } from 'vue'

import { proFormBus, ProFormProvideKey } from './constant'

import type {
  BeforeSearchSubmit,
  NormalizeColProps,
  ProFormBusEventPayload,
  ProFormBusEventType,
  ProFormContext,
  ProFormEventType,
  ProFormItemColSizePayload,
  ProFormItemPreservePayload,
  ProFormValues,
  SubmitterSlotParams,
} from './interface'
import type { commonProps } from './props'
import type { FormInstance } from 'element-plus'
import type { Slot, ExtractPropTypes } from 'vue'

export interface UserFormOptions<T extends ProFormValues = ProFormValues> {
  props: ExtractPropTypes<typeof commonProps>

  beforeSearchSubmit?: BeforeSearchSubmit<T>

  submitterSlot: Slot | undefined

  emit: (type: ProFormEventType, ...args: unknown[]) => void
}

export function useForm<T extends ProFormValues = ProFormValues>(
  options: UserFormOptions<T>
) {
  const { props, submitterSlot, emit, beforeSearchSubmit } = options

  const { initialValues } = props

  // TODO: deep clone
  const formState = reactive<ProFormValues>(
    JSON.parse(JSON.stringify(initialValues))
  )
  const formRef = ref<FormInstance | null>(null)
  const formItemCols = reactive<Record<string, NormalizeColProps>>({})

  /**
   * ProFormItem 的 col 变化时的回调
   * @param payload
   */
  const onProFormItemColSize = (payload: ProFormItemColSizePayload) => {
    if (payload) {
      // col 发生了变化，需要重新计算 tools col 的位置
      // 可能是修改，也可能是卸载
      if (payload.col) {
        formItemCols[payload.prop] = payload.col
      } else {
        delete formItemCols[payload.prop]
      }
    }
  }

  /**
   * ProFormItem 卸载时需要清除 formState 中的值
   * @param payload
   */
  const onProFormItemPreserve = (payload: ProFormItemPreservePayload) => {
    if (!props.preserve) {
      delete formState[payload]
    }
  }

  /**
   * ProFormItem 卸载或者 col 变化的回调
   * @param type
   * @param payload
   * @returns
   */
  const handleProFormItemEvent = (
    type: ProFormBusEventType,
    payload?: ProFormBusEventPayload
  ) => {
    if (type === 'colSize') {
      return onProFormItemColSize(payload as ProFormItemColSizePayload)
    }
    if (type === 'preserve') {
      return onProFormItemPreserve(payload as ProFormItemPreservePayload)
    }
  }

  // 监听 ProFormItem 卸载或者 col 变化的回调
  proFormBus.on(handleProFormItemEvent)

  // 提交栏选项
  const submitterOptions = computed(() => {
    const submitter = props.submitter

    // 当 submitter 为 false，或者两个按钮都为 false 时，不需要显示提交栏
    if (
      submitter === false ||
      (submitter.submitButtonProps === false &&
        submitter.resetButtonProps === false)
    ) {
      return null
    }

    return {
      submitText: submitter.submitButtonText,
      resetText: submitter.resetButtonText,
      submitProps: submitter.submitButtonProps,
      resetProps: submitter.resetButtonProps,
    }
  })

  /**
   * 点击提交按钮
   */
  const handleClickSubmit = async () => {
    if (formRef.value) {
      try {
        const validated = await formRef.value.validate()
        if (validated) {
          emit('finish', beforeSearchSubmit?.(formState as any) ?? formState)
        }
      } catch (e) {
        emit('finishFaild', { values: formState, errorFields: e })
      }
    }
  }

  /**
   * 点击重置按钮
   */
  const handleClickReset = () => {
    if (formRef.value) {
      formRef.value.resetFields()
      emit('reset')
    }
  }

  // 渲染 submitter 插槽的参数
  const submitterSlotParams: SubmitterSlotParams | undefined = submitterSlot
    ? {
        values: formState,
        onSubmit: handleClickSubmit,
        onReset: handleClickReset,
      }
    : undefined

  const renderSubmitter = (colProps: NormalizeColProps) => {
    // 渲染提交栏
    let submitterValue
    let $submitter = null
    if (submitterSlot) {
      $submitter = (
        <ElCol {...colProps}>
          <ElFormItem>{submitterSlot(submitterSlotParams)}</ElFormItem>
        </ElCol>
      )
    } else if ((submitterValue = submitterOptions.value)) {
      $submitter = (
        <ElCol {...colProps}>
          <ElFormItem>
            {submitterValue.submitProps !== false ? (
              <ElButton
                {...submitterValue.submitProps}
                onClick={handleClickSubmit}
              >
                {submitterValue.submitText}
              </ElButton>
            ) : null}

            {submitterValue.resetProps !== false ? (
              <ElButton
                {...submitterValue.resetProps}
                onClick={handleClickReset}
              >
                {submitterValue.resetText}
              </ElButton>
            ) : null}
          </ElFormItem>
        </ElCol>
      )
    }

    return $submitter
  }

  provide<ProFormContext>(ProFormProvideKey, {
    formState,
    formCol: computed(() => props.col),
    submitOnChange: props.submitOnChange,
    onSubmit: handleClickSubmit,
  })

  return {
    values: formState,
    formRef,
    formItemCols,
    renderSubmitter,
  }
}
