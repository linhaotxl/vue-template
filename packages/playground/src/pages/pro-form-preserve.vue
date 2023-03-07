<template>
  <!-- <el-space direction="vertical" alignment="flex-start"> -->
  <pro-form
    label-width="100px"
    :render-tools="true"
    :preserve="true"
    @finish="handleSubmit"
  >
    <pro-form-item
      label="用户名"
      prop="userName"
      label-width="100px"
      required
      value-type="text"
      :field-props="{
        placeholder: '请输入用户名',
        maxlength: 20,
        minlength: 10,
        clearable: true,
        onInput: changeUserName,
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
      label="性别"
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

    <pro-form-item v-slot="{ values }">
      <pro-form-item
        v-if="values.sex === 3"
        label="自定义性别"
        prop="customSex"
      />
    </pro-form-item>
  </pro-form>
  <!-- </el-space> -->
</template>

<script lang="ts" setup name="BasicPage">
const changeUserName = (value: string) => {
  console.log('value is ', value)
}

const handleSubmit = (values: object) => {
  console.log('finish: ', values)
}

// preserve 的触发时机
// 1. 先修改 formState 的 sex
// 2. 触发 ui 更新，customSex 不需要渲染，卸载
// 3. 删除 formState 的 customSex
// 如果用 watch 观察 formState，会看到有两次变化
</script>
