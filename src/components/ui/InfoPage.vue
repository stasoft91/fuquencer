<template>
  <div class="wrapper">
    <h1>Welcome to fuquencer!</h1>
    <p>Click anywhere to start playing. <br> Huge thanksies to Tone.js.</p>
    <p>Alt + wheel: duration</p>
    <p>Shift + wheel: velocity</p>
    <p>Ctrl + wheel: octave</p>
    <p>Wheel: note</p>
  </div>
</template>

<style lang="scss" scoped>
.wrapper {
  isolation: isolate;

  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 0.75rem;
}

</style>
<script lang="ts" setup>
</script>
