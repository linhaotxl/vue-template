# 可能遇到的问题

1. 例如在 `login.vue` 中使用了 `ElMessage`，如果不打开 `login` 页面，那么自动引入的文件中可能不存在 `ElMessage` 全局变量，此时打开 `login` 即可
