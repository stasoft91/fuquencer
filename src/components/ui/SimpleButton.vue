<template>
  <button class="simple-button" @click="onClick">
    <img v-if="icon" :src="icon" alt="" style="height:100%" />
    <slot></slot>
  </button>
</template>

<style scoped lang="scss">
@import '@/assets/variables.scss';
.simple-button {
  background-color: $color-grey-300;
  border: none;
  cursor: pointer;
  padding: 0.5rem 1rem;
  height: 2rem;
  outline: none;
  font-family: 'Roboto Mono', monospace;
}

.simple-button:hover {
  background-color: $color-grey-500;
}

.simple-button:active {
  background-color: $color-grey-600;
}

.simple-button:focus {
  box-shadow: 0 0 0 2px $color-orange-opaque-lighter100;
}

.simple-button img {
  height: 1rem;
}
</style>

<script setup lang="ts">
const emits = defineEmits(['click'])

type Props = {
  icon?: string
}

const props = defineProps<Props>()

const onClick = () => {
  emits('click')
}
</script>
