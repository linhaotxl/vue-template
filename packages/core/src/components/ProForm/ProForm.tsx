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

  emits: ['submit', 'reset'],

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
     * 累加每一个 ProFormItem 的 col，最终计算在 toolColProps
     * @param colProps
     * @param toolColProps
     */
    function accumulProFormItemCol(
      colProps: NormalizeColProps,
      toolColProps: NormalizeColProps
    ) {
      if (hasOwn(toolColProps, 'span')) {
        // 如果 tool 偏移的格子已经不够在放下 ProFormItem，那么会将 tool 放在新的一行最右边
        if (
          hasOwn(toolColProps, 'offset') &&
          24 - (toolColProps.offset! % 24) < colProps.span!
        ) {
          toolColProps.offset ||= 0
          toolColProps.offset! += 24 - toolColProps.offset!
        }

        toolColProps.offset ||= 0

        // toolColProps 的偏移是每个 ProFormItem 的 span + offset
        toolColProps.offset! += (colProps.span || 0) + (colProps.offset || 0)
      }
    }

    /**
     * 确保 tool 始终在一行的最右侧
     * @param toolColProps
     */
    function ensureToolRowRight(toolColProps: NormalizeColProps) {
      if (hasOwn(toolColProps, 'offset')) {
        if ((toolColProps.offset! % 24) + toolColProps.span! > 24) {
          toolColProps.offset = 24 - toolColProps.span!
        } else {
          toolColProps.offset =
            24 - (toolColProps.offset! % 24) - toolColProps.span!
        }
      }
    }

    // 计算 tools col props
    const toolsColProps = props.renderTools
      ? computed(() => {
          // 初始化 tools 的 col span，优先取 toolsCol，如果没有则使用 ProForm 的 col 配置
          const toolColProps: NormalizeColProps = Object.create(null)
          normalizeFormCol(props.toolsCol || props.col, toolColProps)

          // 遍历所有的 ProFormItem，累加每一个 ProFormItem 的占位
          for (const prop in formItemCols) {
            // 获取 ProFormItem 的 col
            const colProps = formItemCols[prop]
            // 累加每一个 ProFormItem 的位置（包括 span + offset）
            accumulProFormItemCol(colProps, toolColProps)

            // 遍历处理响应式的布局，同样累加在 toolColProps 中
            colRanges.forEach(range => {
              if (hasOwn(colProps, range)) {
                accumulProFormItemCol(
                  colProps[range]!,
                  (toolColProps[range] ||= Object.create(null))
                )
              }
            })
          }

          // 确保 tool 始终在一行的最右侧
          // 包括响应式的布局以及普通布局
          colRanges.forEach(range => {
            if (hasOwn(toolColProps, range)) {
              ensureToolRowRight(toolColProps[range]!)
            }
          })
          ensureToolRowRight(toolColProps)

          return toolColProps
        })
      : null

    const handleClickSubmit = async () => {
      if (formRef.value) {
        try {
          const validated = await formRef.value.validate()
          console.log('validated: ', validated)
          if (validated) {
            // debugger
            emit('submit', formState)
          }
        } catch (e) {
          console.log('e: ', e)
        }
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
                      <ElButton type="primary" onClick={handleClickSubmit}>
                        {{ default: () => 'Submit2' }}
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
        <ElForm {...attrs} model={formState} ref={formRef}>
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
