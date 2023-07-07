import type {
  BeforeSearchSubmit,
  ElColProps,
  ProFormEventTypes,
  ProFormValues,
  Submitter,
} from './interface'
import type { PropType } from 'vue'

export const commonProps = {
  /**
   * 每个 ProFormItem 所在的 col
   */
  col: {
    type: [Number, Object] as PropType<number | ElColProps>,
    default: 24,
  },

  /**
   * 初始值
   */
  initialValues: {
    type: Object as PropType<ProFormValues>,
    default: () => ({}),
  },

  /**
   * 当字段被删除时保留字段值
   */
  preserve: {
    type: Boolean as PropType<boolean>,
    default: true,
  },

  submitter: {
    type: [Object, Boolean] as PropType<Submitter | false>,
    default: () =>
      ({
        submitButtonText: '搜索',
        resetButtonText: '重置',
        submitButtonProps: { type: 'primary' },
        resetButtonProps: {},
      } as Submitter),
  },

  /**
   * 当修改表单项时自动提交表单
   */
  submitOnChange: {
    type: Boolean as PropType<boolean>,
    default: false,
  },

  /**
   * 提交前修改数据
   */
  beforeSearchSubmit: Function as PropType<BeforeSearchSubmit<ProFormValues>>,
}

export const commonEmits: ProFormEventTypes = ['finish', 'reset', 'finishFaild']
