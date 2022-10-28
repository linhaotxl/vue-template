import { defineComponent, h, toRef } from 'vue'
import type { PropType } from 'vue'
import { useVirtualList } from './hooks'
import type { ItemSize, UseVirtualListReturn } from './hooks'

export interface VirtualListInstance<T = any> {
  scrollTo: UseVirtualListReturn<T>['scrollTo']
}

const props = {
  source: {
    type: Array as PropType<unknown[]>,
    required: true,
  },

  itemHeight: {
    type: [Number, Function] as PropType<number | ItemSize>,
    required: true,
  },
} as const

export const VirtualList = defineComponent({
  name: 'VirtualList',

  props,

  setup(props, { slots, expose }) {
    const {
      containerProps,
      wrapperProps,
      list,
      scrollTo: _scrollTo,
    } = useVirtualList(toRef(props, 'source'), { itemHeight: props.itemHeight })

    const scrollTo: VirtualListInstance['scrollTo'] = index => {
      _scrollTo(index)
    }

    expose({
      scrollTo,
    })

    return () => {
      const childrenList = list.value.map(data => slots.default?.(data))

      return h('div', { ...containerProps }, [
        h('div', { ...wrapperProps.value }, childrenList),
      ])
    }
  },
})
