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
  /* iOS safe area 全局适配 */
  padding-top: env(safe-area-inset-top, 0px);
  padding-bottom: env(safe-area-inset-bottom, 0px);
  padding-left: env(safe-area-inset-left, 0px);
  padding-right: env(safe-area-inset-right, 0px);
}
</style>
