<script setup lang="ts">
import SequencerGrid from './components/SequencerGrid.vue'
</script>

<template>
  <header>
    <div class="wrapper">
      <h1 class="title">fuquencer</h1>
    </div>
  </header>

  <main>
    <div class="wrapper">
      <SequencerGrid />
    </div>
  </main>
</template>

<style scoped>
header {
  line-height: 1.5;
}
</style>
