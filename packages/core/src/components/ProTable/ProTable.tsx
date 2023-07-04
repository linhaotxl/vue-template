import { ElPagination, ElSpace, ElTable } from 'element-plus'
import { defineComponent, ref, watch, h, Fragment, isVNode } from 'vue'

import { ElTableMethods, ProTableMethods } from './constants'
import { useLoading } from './useLoading'
import { useTable } from './useTable'

import {
  collectComponentMethods,
  collectSlots,
  toPropBooleanValue,
} from '../../utils'
import { ProFormItem, QueryFilter } from '../ProForm'

import type { ProTablePostDataFn, ProTableRequest } from './interface'
import type { QueryFilterProps } from '../ProForm'
import type { PaginationProps, SpaceProps } from 'element-plus'
import type { PropType, VNode, CSSProperties } from 'vue'

const props = {
  request: Function as PropType<ProTableRequest>,

  /**
   * 分页配置，为 false 不展示
   */
  pagination: {
    type: [Boolean, Object] as PropType<false | Partial<PaginationProps>>,
    default: () => ({}),
  },

  /**
   * 用于 request 查询的额外参数，一旦变化会触发重新加载
   */
  params: Object as PropType<any>,

  /**
   * 表格数据，推荐使用 request 来获取数据
   */
  data: Array as PropType<object[]>,

  /**
   * 搜索表单配置
   */
  search: {
    type: [Boolean, Object] as PropType<false | QueryFilterProps>,
    default: () => ({}),
  },

  /**
   * space 的 props
   *
   * @default
   * {
   *   wrap: false,
   *   alignment: 'normal',
   * }
   */
  spaceProps: {
    type: Object as PropType<SpaceProps>,
    default: () => ({
      wrap: false,
      alignment: 'normal',
    }),
  },

  /**
   * space 的 className
   */
  spaceClass: String as PropType<string>,

  /**
   * space 的 style 样式集合
   *
   * @default
   * {
   *   height: '100%',
   *   overflow: 'auto',
   *   display: 'flex',
   *   flexWrap: 'nowrap'
   * }
   */
  spaceStyle: {
    type: Object as PropType<CSSProperties>,
    default: () => ({
      height: '100%',
      overflow: 'auto',
      display: 'flex',
      flexWrap: 'nowrap',
    }),
  },

  /**
   * 对通过 request 获取的数据进行处理
   */
  postData: Function as PropType<ProTablePostDataFn>,
}

export const ProTable = defineComponent({
  name: 'ProTable',

  inheritAttrs: false,

  props,

  expose: [...ElTableMethods, ...ProTableMethods],

  emits: ['load', 'requestError'],

  setup(props, { emit }) {
    const {
      dataSource,
      pageNum,
      pageSize,
      totalPage,
      loading,
      updateParams,
      reload,
    } = useTable({
      request: props.request,
      postData: props.postData,
      data: props.data,
      params: props.params,
      pageSize: 10,
      // onError(err) {
      //   emit('requestError', err)
      // },
    })

    const tableRef = ref()

    // 每次数据加载完成后，执行 load 事件
    watch(dataSource, ds => {
      if (props.request) {
        emit('load', ds)
      }
    })

    // 自动注入 loading
    useLoading({ target: tableRef, loading })

    const handleSubmitSearch = (values: object) => {
      updateParams({ ...values })
    }

    const methodsMap = collectComponentMethods(ElTableMethods, tableRef)

    return {
      ...methodsMap,
      tableRef,
      totalPage,
      pageNum,
      pageSize,
      dataSource,
      handleSubmitSearch,
      reload,
    }
  },

  render() {
    const children = this.$slots.default?.()
    let tableChildren: VNode[] | undefined
    let formChildren: VNode[] | undefined

    if (children) {
      ;[tableChildren, formChildren] = children.reduce<[VNode[], VNode[]]>(
        (prev, child) => {
          if (child.type === Fragment && Array.isArray(child.children)) {
            child.children.forEach(item => {
              if (isVNode(item)) {
                extractFormAndColumn(item, prev)
              }
            })
          } else {
            extractFormAndColumn(child, prev)
          }

          return prev
        },
        [[], []]
      )
    }

    const $search =
      this.search !== false ? (
        <QueryFilter {...this.search} onFinish={this.handleSubmitSearch}>
          {{
            default: () =>
              formChildren?.map(child => <ProFormItem {...child.props} />),
            submitter: (args: unknown) => this.$slots.submitter?.(args),
          }}
        </QueryFilter>
      ) : null

    const tableSlots = collectSlots(this.$slots, ['append', 'empty'])
    if (tableChildren) {
      tableSlots.default = () => tableChildren!
    }

    const $pagination =
      this.pagination !== false ? (
        <ElPagination
          {...this.pagination}
          total={this.totalPage}
          v-model:currentPage={this.pageNum}
          v-model:pageSize={this.pageSize}
        />
      ) : null

    return (
      <ElSpace
        {...this.spaceProps}
        class={this.spaceClass}
        style={this.spaceStyle}
        direction="vertical"
      >
        {$search}

        <ElTable {...this.$attrs} data={this.dataSource} ref="tableRef">
          {tableSlots}
        </ElTable>

        {$pagination}
      </ElSpace>
    )
  },
})

function extractFormAndColumn(child: VNode, prev: [VNode[], VNode[]]) {
  if (child.props) {
    const hideInTable = toPropBooleanValue(child.props, 'hide-in-table')
    const hideInSearch = toPropBooleanValue(child.props, 'hide-in-search')

    if (hideInSearch) {
      prev[0].push(child)
    } else if (hideInTable) {
      prev[1].push(child)
    } else {
      prev[0].push(child)
      prev[1].push(child)
    }
  }
}
