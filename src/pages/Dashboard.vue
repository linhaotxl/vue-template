<template>
  <hello-world :msg="'2'" />

  <TestCompTsx />

  <el-button type="default" @click="handleClickButton">Show Message</el-button>

  <el-date-picker />

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
