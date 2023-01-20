<template>
  <h3>Index Page</h3>

  <el-row>
    <el-col :span="8">
      <div class="box">col-1</div>
    </el-col>

    <el-col :xl="8">
      <div class="box">col-2</div>
    </el-col>

    <el-col :span="8">
      <div class="box">col-3</div>
    </el-col>
  </el-row>
</template>

<script lang="ts" setup name="IndexPage"></script>

<style scoped>
.box {
  padding: 8px 16px;
  border: 1px solid #ffffff44;
}
</style>
