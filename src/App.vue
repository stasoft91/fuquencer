<script setup lang="ts">
import SequencerGrid from './components/SequencerGrid.vue'
import {darkTheme, NConfigProvider, NDialogProvider} from 'naive-ui'

const theme = darkTheme
</script>

<template>

  <header>
    <div class="wrapper">
      <h1 class="title">fuquencer</h1>
    </div>
  </header>

  <main>
    <div class="wrapper">
      <n-config-provider :theme="theme">
        <n-dialog-provider>
          <SequencerGrid/>
        </n-dialog-provider>
      </n-config-provider>
    </div>
  </main>

</template>

<style scoped>
header {
  line-height: 1.5;
}
</style>
