import type { ElColProps, Submitter } from './interface'
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

  submitter: {
    type: [Object, Boolean] as PropType<Submitter | false>,
    default: () =>
      ({
        submitButtonText: '确认',
        resetButtonText: '重置',
        submitButtonProps: { type: 'primary' },
        resetButtonProps: {},
      } as Submitter),
  },
}