<template>
  <!-- <el-space direction="vertical" alignment="flex-start"> -->
  <pro-form
    label-width="100px"
    :render-tools="true"
    @finish="handleSubmit"
    @finish-faild="handleFinishFailed"
  >
    <pro-form-item
      label="普通输入框"
      prop="userName"
      label-width="100px"
      required
      value-type="text"
      :field-props="{
        placeholder: '请输入用户名',
        maxlength: 20,
        minlength: 10,
        clearable: true,
      }"
    />

    <pro-form-item
      label="文本域"
      prop="textarea"
      label-width="100px"
      required
      value-type="textarea"
      :field-props="{
        placeholder: '请输入文本内容',
      }"
    />

    <pro-form-item
      label="密码"
      prop="password"
      required
      value-type="password"
      :field-props="{ placeholder: '请输入密码' }"
    />

    <pro-form-item
      label="下拉框"
      prop="sex"
      required
      value-type="select"
      :value-enum="[
        { label: '男', value: 1 },
        { label: '女', value: 2 },
        { label: '自定义', value: 3 },
      ]"
      :field-props="{ placeholder: '请选择性别' }"
    >
    </pro-form-item>

    <pro-form-item
      label="复选框"
      prop="checkbox"
      required
      value-type="checkbox"
      :value-enum="[
        { label: '男', value: 1 },
        { label: '女', value: 2 },
        { label: '自定义', value: 3 },
      ]"
      :field-props="{ min: 0, max: 2 }"
    />

    <pro-form-item
      label="按钮复选框"
      prop="checkboxButton"
      required
      value-type="checkbox-button"
      :value-enum="[
        { label: '男', value: 1 },
        { label: '女', value: 2 },
        { label: '自定义', value: 3 },
      ]"
      :field-props="{ min: 0, max: 2 }"
    />

    <pro-form-item
      label="单选框"
      prop="radio"
      required
      value-type="radio"
      :value-enum="[
        { label: '男', value: 1 },
        { label: '女', value: 2 },
        { label: '自定义', value: 3 },
      ]"
      :field-props="{ disabled: true }"
    />

    <pro-form-item
      label="按钮单选框"
      prop="radioButton"
      required
      value-type="radio-button"
      :value-enum="[
        { label: '男', value: 1 },
        { label: '女', value: 2 },
        { label: '自定义', value: 3 },
      ]"
      :field-props="{ textColor: '#f99' }"
    />

    <pro-form-item
      label="颜色"
      prop="color"
      required
      value-type="color"
      :field-props="{ size: 'small' }"
    />

    <pro-form-item
      label="日期"
      prop="date"
      required
      value-type="date"
      :field-props="{
        valueFormat: 'YYYY-MM-DD HH:mm:ss',
        onVisibleChange: handleChangeDateVisible,
      }"
    />

    <pro-form-item
      label="周"
      prop="week"
      required
      value-type="date-week"
      :field-props="{}"
    />

    <pro-form-item
      label="月"
      prop="month"
      required
      value-type="date-month"
      :field-props="{}"
    />

    <pro-form-item
      label="年"
      prop="year"
      required
      value-type="date-year"
      :field-props="{}"
    />

    <pro-form-item
      label="多个日期"
      prop="dates"
      required
      value-type="dates"
      :field-props="{}"
    />

    <pro-form-item
      label="日期范围"
      prop="dateRange"
      required
      value-type="date-range"
      :field-props="{}"
    />

    <pro-form-item
      label="月范围"
      prop="monthRange"
      required
      value-type="date-month-range"
      :field-props="{}"
    />

    <pro-form-item
      label="日期时间"
      prop="dateTime"
      required
      value-type="date-time"
      :field-props="{}"
    />

    <pro-form-item
      label="日期时间范围"
      prop="dateTimeRange"
      required
      value-type="date-time-range"
      :field-props="{}"
    />

    <pro-form-item
      label="时间"
      prop="time"
      required
      value-type="time"
      :field-props="{}"
    />

    <pro-form-item
      label="选择时间"
      prop="timeSelect"
      required
      value-type="time-select"
      :field-props="{}"
    />

    <pro-form-item
      label="滑块"
      prop="slider"
      required
      value-type="slider"
      :field-props="{}"
    />

    <pro-form-item
      label="开关"
      prop="switch"
      required
      value-type="switch"
      :field-props="{}"
    />

    <pro-form-item
      label="评分"
      prop="rate"
      required
      value-type="rate"
      :field-props="{}"
    />
  </pro-form>
  <!-- </el-space> -->
</template>

<script lang="ts" setup name="BasicPage">
const handleSubmit = (values: unknown) => {
  console.log('submit: ', values)
}

const handleFinishFailed = ({ values, errorFields }: any) => {
  console.log('failed: ', values, errorFields)
}

const handleChangeDateVisible = (visible: boolean) => {
  console.log('日期窗打开状态: ', visible)
}
</script>
