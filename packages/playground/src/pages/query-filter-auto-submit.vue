<template>
  <!-- <el-space direction="vertical" alignment="flex-start"> -->
  <query-filter
    label-width="100px"
    :render-tools="true"
    :col="formCol"
    :submitter="false"
    submit-on-change
    @finish="handleSubmit"
    @finish-faild="handleFinishFailed"
  >
    <pro-form-item
      label="用户名"
      prop="userName"
      label-width="100px"
      :col="userNameCol"
      value-type="text"
      :field-props="{
        placeholder: '请输入用户名',
        maxlength: 20,
        minlength: 10,
        clearable: true,
      }"
    />

    <pro-form-item
      label="密码"
      prop="password"
      value-type="password"
      :field-props="{ placeholder: '请输入密码' }"
    />

    <pro-form-item
      label="性别"
      prop="sex"
      :col="sexCol"
      value-type="select"
      :value-enum="[
        { label: '男', value: 1 },
        { label: '女', value: 2 },
        { label: '自定义', value: 3 },
      ]"
      :field-props="{ placeholder: '请选择性别', onChange: changeSex }"
    >
    </pro-form-item>

    <pro-form-item v-slot="{ values }">
      <pro-form-item
        v-if="values.sex === 3"
        label="自定义性别"
        prop="customSex"
      />
    </pro-form-item>
  </query-filter>
  <!-- </el-space> -->
</template>

<script lang="ts" setup name="BasicPage">
const sleep = (time: number) => new Promise(r => setTimeout(r, time))

const changeSex = async (value: string) => {
  await sleep(1000)
  console.log('value is ', value)
}

const handleSubmit = (values: unknown) => {
  console.log('submit: ', values)
}

const handleFinishFailed = ({ values, errorFields }: any) => {
  console.log('failed: ', values, errorFields)
}

const formCol = ref({ span: 6, lg: 4 })
const userNameCol = ref({ span: 12, lg: 10 })
const sexCol = { span: 6, lg: 12 }
</script>
