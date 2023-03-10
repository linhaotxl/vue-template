import {
  ElCheckbox,
  ElCheckboxButton,
  ElCheckboxGroup,
  ElColorPicker,
  ElDatePicker,
  ElInput,
  ElInputNumber,
  ElOption,
  ElRadio,
  ElRadioButton,
  ElRadioGroup,
  ElRate,
  ElSelect,
  ElSlider,
  ElSwitch,
  ElTimePicker,
  ElTimeSelect,
} from 'element-plus'
import { h } from 'vue'

import type { VNode } from 'vue'

export const enum ValueTypes {
  Text = 'text',
  Textarea = 'textarea',
  Digit = 'digit',
  Password = 'password',
  Select = 'select',
  Checkbox = 'checkbox',
  CheckboxButton = 'checkbox-button',
  Radio = 'radio',
  RadioButton = 'radio-button',
  Color = 'color',
  Date = 'date',
  Dates = 'dates',
  DateWeek = 'date-week',
  DateMonth = 'date-month',
  DateYear = 'date-year',
  DateRange = 'date-range',
  DateMonthRange = 'date-month-range',
  DateTime = 'date-time',
  DateTimeRange = 'date-time-range',
  Time = 'time',
  TimeSelect = 'time-select',
  Rate = 'rate',
  Slider = 'slider',
  Switch = 'switch',
}

type RenderValueTypeParams = {
  formState: Record<string, unknown>
  props: {
    // [key: string]: any
    prop: string
    fieldProps?: Record<string, unknown>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    valueEnum?: { label: string; value: any }[]
  }
}
type RenderValueType = (params: RenderValueTypeParams) => VNode

export const valueTypeMap: Record<ValueTypes, RenderValueType> = {
  [ValueTypes.Text]: ({ formState, props }) => (
    <ElInput {...props.fieldProps} v-model={formState[props.prop]} />
  ),

  [ValueTypes.Textarea]: ({ formState, props }) => (
    <ElInput
      {...props.fieldProps}
      type="textarea"
      v-model={formState[props.prop]}
    />
  ),

  [ValueTypes.Digit]: ({ formState, props }) => (
    <ElInputNumber {...props.fieldProps} v-model={formState[props.prop]} />
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

  [ValueTypes.Checkbox]: ({ props, formState }) => (
    <ElCheckboxGroup {...props.fieldProps} v-model={formState[props.prop]}>
      {props.valueEnum?.map(item => (
        <ElCheckbox label={item.value}>{item.label}</ElCheckbox>
      ))}
    </ElCheckboxGroup>
  ),

  [ValueTypes.CheckboxButton]: ({ props, formState }) => (
    <ElCheckboxGroup {...props.fieldProps} v-model={formState[props.prop]}>
      {props.valueEnum?.map(item => (
        <ElCheckboxButton label={item.value}>{item.label}</ElCheckboxButton>
      ))}
    </ElCheckboxGroup>
  ),

  [ValueTypes.Radio]: ({ props, formState }) => (
    <ElRadioGroup {...props.fieldProps} v-model={formState[props.prop]}>
      {props.valueEnum?.map(item => (
        <ElRadio label={item.value}>{item.label}</ElRadio>
      ))}
    </ElRadioGroup>
  ),

  [ValueTypes.RadioButton]: ({ props, formState }) => (
    <ElRadioGroup {...props.fieldProps} v-model={formState[props.prop]}>
      {props.valueEnum?.map(item => (
        <ElRadioButton label={item.value}>{item.label}</ElRadioButton>
      ))}
    </ElRadioGroup>
  ),

  [ValueTypes.Color]: ({ props, formState }) => (
    <ElColorPicker {...props.fieldProps} v-model={formState[props.prop]} />
  ),

  [ValueTypes.Date]: ({ formState, props }) => (
    <ElDatePicker
      valueFormat="YYYY-MM-DD"
      {...props.fieldProps}
      v-model={formState[props.prop]}
    />
  ),

  [ValueTypes.DateMonth]: ({ formState, props }) => (
    <ElDatePicker
      valueFormat="YYYY-MM-DD"
      {...props.fieldProps}
      type="month"
      v-model={formState[props.prop]}
    />
  ),

  [ValueTypes.DateMonthRange]: ({ formState, props }) => (
    <ElDatePicker
      valueFormat="YYYY-MM"
      {...props.fieldProps}
      type="monthrange"
      v-model={formState[props.prop]}
    />
  ),

  [ValueTypes.DateRange]: ({ formState, props }) => (
    <ElDatePicker
      valueFormat="YYYY-MM-DD"
      {...props.fieldProps}
      type="daterange"
      v-model={formState[props.prop]}
    />
  ),

  [ValueTypes.DateWeek]: ({ formState, props }) => (
    <ElDatePicker
      valueFormat="YYYY-MM-DD"
      {...props.fieldProps}
      type="week"
      v-model={formState[props.prop]}
    />
  ),

  [ValueTypes.DateYear]: ({ formState, props }) => (
    <ElDatePicker
      valueFormat="YYYY"
      {...props.fieldProps}
      type="year"
      v-model={formState[props.prop]}
    />
  ),

  [ValueTypes.Dates]: ({ formState, props }) => (
    <ElDatePicker
      valueFormat="YYYY-MM-DD"
      {...props.fieldProps}
      type="dates"
      v-model={formState[props.prop]}
    />
  ),

  [ValueTypes.DateTime]: ({ formState, props }) => (
    <ElDatePicker
      valueFormat="YYYY-MM-DD HH:mm:ss"
      {...props.fieldProps}
      type="datetime"
      v-model={formState[props.prop]}
    />
  ),

  [ValueTypes.DateTimeRange]: ({ formState, props }) => (
    <ElDatePicker
      valueFormat="YYYY-MM-DD HH:mm:ss"
      {...props.fieldProps}
      type="datetimerange"
      v-model={formState[props.prop]}
    />
  ),

  [ValueTypes.Time]: ({ formState, props }) => (
    <ElTimePicker
      valueFormat="HH:mm:ss"
      {...props.fieldProps}
      v-model={formState[props.prop]}
    />
  ),

  [ValueTypes.TimeSelect]: ({ formState, props }) => (
    <ElTimeSelect {...props.fieldProps} v-model={formState[props.prop]} />
  ),

  [ValueTypes.Rate]: ({ formState, props }) => (
    <ElRate {...props.fieldProps} v-model={formState[props.prop]} />
  ),

  [ValueTypes.Slider]: ({ formState, props }) => (
    <ElSlider {...props.fieldProps} v-model={formState[props.prop]} />
  ),

  [ValueTypes.Switch]: ({ formState, props }) => (
    <ElSwitch {...props.fieldProps} v-model={formState[props.prop]} />
  ),
}
