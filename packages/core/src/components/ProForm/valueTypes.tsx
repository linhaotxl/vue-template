import { ElInput, ElOption, ElSelect } from 'element-plus'
import { h } from 'vue'

export const enum ValueTypes {
  Text = 'text',
  Password = 'password',
  Select = 'select',
}

type RenderValueTypeParams = {
  formState: Record<string, unknown>
  props: {
    [key: string]: any

    valueEnum?: { label: string; value: any }[]
  }
}
type RenderValueType = (params: RenderValueTypeParams) => any

export const valueTypeMap: Record<ValueTypes, RenderValueType> = {
  [ValueTypes.Text]: ({ formState, props }) => (
    <ElInput {...props.fieldProps} v-model={formState[props.prop]} />
  ),

  [ValueTypes.Password]: ({ formState, props }) => (
    <ElInput
      {...props.fieldProps}
      v-model={formState[props.prop]}
      showPassword
    />
  ),

  [ValueTypes.Select]: ({ formState, props }) => (
    <ElSelect {...props.fieldProps} v-model={formState[props.prop]}>
      {props.valueEnum?.map(item => (
        <ElOption label={item.label} value={item.value} />
      ))}
    </ElSelect>
  ),
}

export const valueType2ComponentName: Record<string, string> = {
  [ValueTypes.Text]: 'el-input',
  [ValueTypes.Password]: 'el-input',
  [ValueTypes.Select]: 'el-select',
}
