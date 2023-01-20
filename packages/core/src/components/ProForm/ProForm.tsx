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
import { colRanges, hasOwn, normalizeFormCol } from './utils'

import type {
  ProFormItemColSizePayload,
  ElColProps,
  NormalizeColProps,
  ProFormBusEventType,
  ProFormContext,
  ProFormBusEventPayload,
  ProFormItemPreservePayload,
} from './interface'
import type { FormInstance } from 'element-plus'
import type { PropType, ComputedRef } from 'vue'

const props = {
  /**
   * 每个 ProFormItem 所在的 col
   */
  col: {
    type: [Number, Object] as PropType<number | ElColProps>,
    default: 24,
  },

  /**
   * 是否渲染 tools
   */
  renderTools: {
    type: Boolean as PropType<boolean>,
    default: true,
  },

  /**
   * tools 所在的 col props
   */
  toolsCol: [Number, Object] as PropType<number | ElColProps>,

  /**
   * 初始值
   */
  initialValues: {
    type: Object as PropType<Record<string, unknown>>,
    default: () => ({}),
  },

  /**
   * 当字段被删除时保留字段值
   */
  preserve: {
    type: Boolean as PropType<boolean>,
    default: true,
  },
}

export const ProForm = defineComponent({
  name: 'ProForm',

  props,

  emits: ['submit'],

  setup(props, { attrs, slots }) {
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
     * @param _
     * @param payload
     */
    const onProFormItemColSize = (payload: ProFormItemColSizePayload) => {
      if (payload) {
        if (payload.col) {
          formItemCols[payload.prop] = payload.col
        } else {
          delete formItemCols[payload.prop]
        }
      }
    }

    const onProFormItemPreserve = (payload: ProFormItemPreservePayload) => {
      if (!props.preserve) {
        delete formState[payload]
      }
    }

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

    // 监听 ProFormItem col 的变化
    proFormBus.on(handleProFormItemEvent)

    // 计算 tools col props
    const toolsColProps = props.renderTools
      ? computed(() => {
          function aaa(
            colProps: NormalizeColProps,
            toolColProps: NormalizeColProps
          ) {
            if (hasOwn(toolColProps, 'span')) {
              if (
                hasOwn(toolColProps, 'offset') &&
                24 - (toolColProps.offset! % 24) < colProps.span!
              ) {
                toolColProps.offset ||= 0
                toolColProps.offset! += 24 - toolColProps.offset!
              }

              toolColProps.offset ||= 0

              toolColProps.offset! +=
                (colProps.span || 0) + (colProps.offset || 0)
            }
          }

          /**
           *
           * @param toolColProps
           */
          function bbb(toolColProps: NormalizeColProps) {
            if (hasOwn(toolColProps, 'offset')) {
              if ((toolColProps.offset! % 24) + toolColProps.span! > 24) {
                toolColProps.offset = 24 - toolColProps.span!
              } else {
                toolColProps.offset =
                  24 - (toolColProps.offset! % 24) - toolColProps.span!
              }
            }
          }

          // 初始化 tools 的 col span，有限取 toolsCol，如果没有则使用 ProForm 的 col 配置
          const toolColProps: NormalizeColProps = Object.create(null)
          normalizeFormCol(props.toolsCol || props.col, toolColProps)

          // 遍历所有的 ProFormItem，累加每一个 ProFormItem 的占位
          for (const prop in formItemCols) {
            // 获取 ProFormItem 的 col
            const colProps = formItemCols[prop]
            // 累加每一个 ProFormItem 的位置（包括 span + offset）
            aaa(colProps, toolColProps)

            colRanges.forEach(range => {
              if (hasOwn(colProps, range)) {
                aaa(
                  colProps[range]!,
                  (toolColProps[range] ||= Object.create(null))
                )
              }
            })
          }

          colRanges.forEach(range => {
            if (hasOwn(toolColProps, range)) {
              bbb(toolColProps[range]!)
            }
          })
          // 如果 tools 的偏移和宽度已经超出一行，则换行
          // 否则重新计算 tools 的偏移，总宽度 - 偏移 - 宽度

          bbb(toolColProps)

          return toolColProps
        })
      : null

    const handleClickSubmit = async () => {
      if (formRef.value) {
        const validated = await formRef.value.validate()
      }
    }

    return () => {
      const children = slots.default?.()

      const $tools = props.renderTools ? (
        <ElCol {...(toolsColProps as ComputedRef).value}>
          {{
            default: () => (
              <ElFormItem>
                {{
                  default: () => (
                    <>
                      <ElButton onClick={handleClickSubmit}>
                        {{ default: () => 'Submit' }}
                      </ElButton>
                      <ElButton>Reset</ElButton>
                    </>
                  ),
                }}
              </ElFormItem>
            ),
          }}
        </ElCol>
      ) : null

      return (
        <ElForm {...attrs} model={formState} ref="formRef">
          {{
            default: () => (
              <ElRow>
                {{
                  default: () => (
                    <>
                      {children}
                      {$tools}
                    </>
                  ),
                }}
              </ElRow>
            ),
          }}
        </ElForm>
      )
    }
  },
})
