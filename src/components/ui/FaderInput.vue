<template>
  <div class="wrapper">
    <input type="range" :min="min" :max="max" v-model="value"/>
  </div>
</template>

<script lang="ts" setup>
const value = defineModel<number>()

const props = defineProps<{
  min: number,
  max: number,
}>()
</script>

<style scoped lang="scss">
.wrapper {
  isolation: isolate;
  position: relative;
  height: 20rem;
  width: 6rem;

  &::before,
  &::after {
    display: block;
    position: absolute;
    z-index: 99;
    color: #fff;
    width: 100%;
    text-align: center;
    font-size: 1.5rem;
    line-height: 1;
    padding: .75rem 0;
    pointer-events: none;
  }

  &::before {
    content: "+";
  }

  &::after {
    content: "−";
    bottom: 0;
  }
}

input[type="range"] {
  -webkit-appearance: none;
  background-color: rgba(#fff, .2);
  position: absolute;
  top: 50%;
  left: 50%;
  margin: 0;
  padding: 0;
  width: 20rem;
  height: 3.5rem;
  transform: translate(-50%, -50%) rotate(-90deg);
  border-radius: 1rem;
  overflow: hidden;
  cursor: row-resize;

  &[step]{
    --stepSize: 5%;
    background-color: transparent;
    background-image: repeating-linear-gradient(to right, rgba(#fff, .2), rgba(#fff, .2) calc(var(--stepSize) - 1px), #05051a var(--stepSize));
  }

  &::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 0;
    box-shadow: -20rem 0 0 20rem rgba(#fff, 0.2);
  }

  &::-moz-range-thumb {
    border: none;
    width: 0;
    box-shadow: -20rem 0 0 20rem rgba(#fff, 0.2);
  }
}

</style>
