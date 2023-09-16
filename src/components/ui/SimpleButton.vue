<template>
  <button :class="{disabled}" :disabled="disabled" class="simple-button" @click="onClick">
    <img v-if="icon" :src="icon" alt="" style="height: 80%"/>
    <slot></slot>
    <span v-if="value !== null" :class="{disabled: !value}" class="indicator"></span>
  </button>
</template>

<style scoped lang="scss">
@import '@/assets/variables.scss';
.simple-button {
  position: relative;
  background-color: $color-grey-300;
  border: none;
  cursor: pointer;
  padding: 0.5rem 1rem;
  height: 2rem;
  outline: none;
  font-family: 'Roboto Mono', monospace;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.simple-button:hover {
  background-color: $color-grey-400;
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

.simple-button.disabled {
  background-color: transparentize($color-grey-700, .8);
  cursor: not-allowed;
}

.simple-button.disabled:hover {
  background-color: transparentize($color-grey-700, .8);
}

.indicator {
  position: absolute;
  top: 2px;
  right: 2px;
  background-color: $color-green;
  box-shadow: 0 0 2px 2px $color-green-lighter100;

  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
}

.indicator.disabled {
  background-color: $color-red;
  box-shadow: inset 0 0 1px 1px $color-red-lighter100;

}
</style>

<script setup lang="ts">
const emits = defineEmits(['click'])

type Props = {
  icon?: string
  disabled?: boolean
  value?: boolean | null
}

withDefaults(defineProps<Props>(), {
  value: null,
});

const onClick = () => {
  emits('click')
}
</script>
