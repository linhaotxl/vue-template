<template>
  <h3>Login</h3>

  <el-icon :size="50"><i-ep-edit /></el-icon>
  <el-icon :size="50"><i-ep-minus /></el-icon>

  <el-icon :size="50">
    <i-vis-vue />
  </el-icon>

  <el-icon :size="50">
    <i-ic-baseline-5g />
  </el-icon>

  <div class="w-50 h-50 i-ic-baseline-5g"></div>
</template>

<script lang="ts" setup name="LoginPage">
import type { Action } from 'element-plus'

ElMessageBox.alert('This is a message', 'Title', {
  // if you want to disable its autofocus
  // autofocus: false,
  confirmButtonText: 'OK',
  callback: (action: Action) => {
    ElMessage({
      type: 'info',
      message: `action: ${action}`,
    })
  },
})
</script>
