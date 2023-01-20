<template>
  <el-button type="primary" @change="changeInitialValues"
    >Change InitialValues</el-button
  >

  <!-- <el-space direction="vertical" alignment="flex-start"> -->
  <pro-form
    label-width="100px"
    :render-tools="true"
    :initial-values="initialValues"
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

    <pro-form-item v-slot="{ form }">
      <pro-form-item
        v-if="form.sex === 3"
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

const initialValues = reactive({
  userName: 'IconMan',
  sex: 3,
})

const changeInitialValues = () => {
  initialValues.sex = 1
}
</script>
