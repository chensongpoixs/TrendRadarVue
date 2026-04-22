<template>
  <div id="app">
    <el-config-provider :locale="zhCN">
      <router-view />
    </el-config-provider>
  </div>
</template>

<script setup lang="ts">
import zhCN from 'element-plus/es/locale/lang/zh-cn'
</script>

<style>
#app {
  width: 100%;
  height: 100%;
}
</style>
