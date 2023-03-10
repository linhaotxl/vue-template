import { defineComponent, inject } from 'vue'

import { defaultProFormContext, ProFormProvideKey } from './constant'

import type { ProFormContext } from './interface'
import type { PropType } from 'vue'

const props = {
  modelValue: {
    type: Array as PropType<object[]>,
  },
}

export const ProFormList = defineComponent({
  name: 'ProFormList',

  props,

  emits: ['update:model-value'],

  setup(props, { emit }) {
    const { formState: values } = inject<ProFormContext>(
      ProFormProvideKey,
      defaultProFormContext()
    )

    /**
     * 增加列表项
     * @param initialValue 初始值
     * @param index 插入位置，默认添加在列表最后
     */
    function add(initialValue: object, index?: number) {
      const list = props.modelValue?.slice() ?? []
      if (index) {
        list.splice(index, 0, initialValue)
      } else {
        list.push(initialValue)
      }
      notify(list)
    }

    /**
     * 清空列表项
     */
    function clear() {
      notify([])
    }

    /**
     * 根据索引删除列表项，默认删除最后一个
     * @param index
     */
    function remove(index: number) {
      const list = props.modelValue?.slice() ?? []
      list.splice(typeof index !== 'number' ? list.length - 1 : index, 1)
      notify(list)
    }

    /**
     * 通知外部修改列表值
     */
    function notify(list: object[]) {
      emit('update:model-value', list)
    }

    return {
      values,
      add,
      remove,
      clear,
    }
  },

  render() {
    return this.$slots.default?.({
      add: this.add,
      remove: this.remove,
      clear: this.clear,
      list: this.modelValue,
      values: this.values,
    })
  },
})
