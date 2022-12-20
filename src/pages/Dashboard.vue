<template>
  <h2>Dashboard Layout</h2>

  <hello-world :msg="'2'" />

  <TextCompTsx />

  <el-button type="primary" @click="handleClickButton">Click</el-button>

  <el-link href="https://element.eleme.io" target="_blank">default</el-link>

  <router-view />
</template>

<script lang="ts" setup name="DashboardLayout">
const handleClickButton = () => {
  ElMessage({
    message: '111',
    type: 'success',
  })
}
</script>
