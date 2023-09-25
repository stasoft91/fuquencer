<template>
  <div class="wrapper" @dblclick="onDblClick">
    <input v-model.number="value" :max="max" :min="min" :step="step ?? 1" type="range"/>
  </div>
</template>

<script lang="ts" setup>
const value = defineModel<number>()

const props = defineProps<{
  min: number,
  max: number,
  step?: number,
  defaultValue?: number,
}>()

const onDblClick = () => {
  props.defaultValue !== undefined && (value.value = props.defaultValue)
}
</script>

<style scoped lang="scss">
.wrapper {
  isolation: isolate;
  position: relative;
  height: 20rem;
  width: 4rem;

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
