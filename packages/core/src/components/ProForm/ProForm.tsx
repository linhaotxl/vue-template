import { ElButton, ElCol, ElForm, ElFormItem, ElRow } from 'element-plus'
import {
  defineComponent,
  reactive,
  computed,
  provide,
  h,
  watch,
  ref,
} from 'vue'

import { proFormBus, ProFormProvideKey } from './constant'
import { commonProps } from './props'
import { normalizeFormCol } from './utils'

import type {
  ProFormItemColSizePayload,
  NormalizeColProps,
  ProFormBusEventType,
  ProFormContext,
  ProFormBusEventPayload,
  ProFormItemPreservePayload,
  ElColProps,
  SubmitterSlotParams,
} from './interface'
import type { FormInstance } from 'element-plus'
import type { PropType } from 'vue'

const props = {
  ...commonProps,

  /**
   * tools 所在的 col props
   */
  toolsCol: [Number, Object] as PropType<number | ElColProps>,
}

export const ProForm = defineComponent({
  name: 'ProForm',

  props,

  emits: ['finish', 'reset', 'finishFaild'],

  setup(props, { attrs, slots, emit }) {
    // TODO: deep clone
    const formState = reactive<Record<string, unknown>>(
      JSON.parse(JSON.stringify(props.initialValues))
    )
    const formItemCols = reactive<Record<string, NormalizeColProps>>({})
    const formRef = ref<FormInstance | null>(null)

    provide<ProFormContext>(ProFormProvideKey, {
      formState,
      formCol: computed(() => props.col),
    })

    watch(
      formState,
      state => {
        console.log('state: ', state)
      },
      { immediate: true, flush: 'post' }
    )

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

    /**
     * 点击提交按钮
     */
    const handleClickSubmit = async () => {
      if (formRef.value) {
        try {
          const validated = await formRef.value.validate()
          if (validated) {
            emit('finish', formState)
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

    const toolsColProps = computed(() => {
      const toolColProps: NormalizeColProps = {}
      normalizeFormCol(props.toolsCol || props.col, toolColProps)
      return toolColProps
    })

    // 提交栏选项
    const submitter = computed(() => {
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

    // 渲染 submitter 插槽的参数
    const submitterSlotParams: SubmitterSlotParams | undefined = slots.submitter
      ? {
          values: formState,
          onSubmit: handleClickSubmit,
          onReset: handleClickReset,
        }
      : undefined

    return () => {
      console.log(slots)
      const children = slots.default?.()
      // const customSubmitter = slots.submitter?.()
      const submitterValue = submitter.value

      const $submitter = slots.submitter ? (
        <ElCol {...toolsColProps.value}>
          <ElFormItem>{slots.submitter(submitterSlotParams)}</ElFormItem>
        </ElCol>
      ) : submitterValue ? (
        <ElCol {...toolsColProps.value}>
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
      ) : null

      return (
        <ElForm {...attrs} model={formState} ref={formRef}>
          <ElRow>
            <>
              {children}
              {$submitter}
            </>
          </ElRow>
        </ElForm>
      )
    }
  },
})
