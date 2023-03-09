import { ElTable } from 'element-plus'
import { defineComponent, ref } from 'vue'

import { useTable } from './useTable'

import type { ProTableRequest } from './interface'
import type { PaginationProps } from 'element-plus'
import type { PropType } from 'vue'

const props = {
  request: Function as PropType<ProTableRequest>,

  /**
   * 分页配置，为 false 不展示
   */
  pagination: {
    type: [Boolean, Object] as PropType<false | PaginationProps>,
    default: () => ({}),
  },

  /**
   * 用于 request 查询的额外参数，一旦变化会触发重新加载
   */
  params: Object as PropType<object>,

  /**
   * 表格数据，推荐使用 request 来获取数据
   */
  data: Array as PropType<object[]>,
}

export const ProTable = defineComponent({
  name: 'ProTable',

  props,

  setup(props, { slots, attrs }) {
    const { dataSource } = useTable({
      request: props.request,
      data: props.data,
      params: props.params,
      pageSize: 10,
    })

    return () => {
      const children = slots.default?.()

      return (
        <ElTable {...attrs} data={dataSource.value}>
          {children}
        </ElTable>
      )
    }
  },
})
