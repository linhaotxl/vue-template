import { computed, defineComponent, reactive, h } from 'vue'

import { ProForm } from './ProForm'
import { commonProps } from './props'
import { colRanges, hasOwn, normalizeFormCol } from './utils'

import type { NormalizeColProps } from './interface'

const props = { ...commonProps }

export const QueryFilter = defineComponent({
  name: 'QueryFilter',

  props,

  setup(props, { slots }) {
    const formItemCols = reactive<Record<string, NormalizeColProps>>({})

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
          normalizeFormCol(props.col, toolColProps)

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
      : undefined

    return () => {
      const children = slots.default?.()

      return (
        <ProForm {...props} toolsCol={toolsColProps?.value}>
          {children}
        </ProForm>
      )
    }
  },
})
