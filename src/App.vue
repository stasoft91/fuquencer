<script setup lang="ts">
import {darkTheme, NConfigProvider, NDialogProvider, NLoadingBarProvider} from 'naive-ui'
import Layout from "@/AppLayout.vue";

const theme = darkTheme
</script>

<template>

  <n-config-provider :theme="theme">
    <n-dialog-provider>
      <n-loading-bar-provider>
        <Layout></Layout>
      </n-loading-bar-provider>
    </n-dialog-provider>
  </n-config-provider>
</template>

