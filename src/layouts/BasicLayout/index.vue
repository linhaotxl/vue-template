<template>
  <el-container class="overflow-auto h-full">
    <el-header> Header </el-header>

    <el-container class="overflow-auto">
      <el-aside width="var(--aside-width)">
        <el-scrollbar view-class="h-full">
          <el-menu
            class="h-full"
            router
            :default-openeds="defaultOpeneds"
            :default-active="defaultActive"
          >
            <recursion-menu :menus="menus" />
          </el-menu>
        </el-scrollbar>
      </el-aside>

      <el-scrollbar class="w-full" view-class="h-full">
        <el-main class="h-full !overflow-visible">
          <router-view />
        </el-main>
      </el-scrollbar>
    </el-container>
  </el-container>
</template>

<script lang="ts" setup name="BasicLayout">
import { useMenu } from '~/hooks'

const { menus, defaultOpeneds, defaultActive } = useMenu()
</script>
