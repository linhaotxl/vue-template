<template>
  <el-button type="primary" @click="toggleDarkMode">Toggle Theme</el-button>
  <router-view />
</template>

<script lang="ts" setup name="BasicLayout">
const isDark = useDark()
const toggleDark = useToggle(isDark)

function toggleDarkMode() {
  toggleDark()
}

watch(
  isDark,
  dark => {
    console.log(dark)
  },
  { immediate: true }
)
</script>
