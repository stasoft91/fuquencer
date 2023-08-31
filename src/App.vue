<script setup lang="ts">
import {darkTheme, NConfigProvider, NDialogProvider} from 'naive-ui'
import Layout from "@/AppLayout.vue";

const theme = darkTheme
</script>

<template>
  <n-config-provider :theme="theme">
    <n-dialog-provider>
      <Layout></Layout>
    </n-dialog-provider>
  </n-config-provider>
</template>

