<template>
  <div :style="{'--pulses': props.pulses}" class="flex">
    <div v-for="(hasPulse, i) in pulseArray" :key="`${hasPulse}_${i}`" :style="getSectorStyle(i, !!hasPulse)"
         class="sector"></div>
  </div>
</template>

<script lang="ts" setup>
import {computed} from "vue";
import {createEuclideanRhythmVector} from "~/lib/utils/createEuclideanRhythmVector";

interface Props {
  pulses: number,
  parts: number,
  shift: number
}

const props = defineProps<Props>()

const pulseArray = computed(() => {
  return createEuclideanRhythmVector(props.pulses, props.parts, props.shift)
})

const getSectorStyle = (index: number, hasPulse: boolean) => {
  return {
    backgroundColor: !hasPulse ? "grey" : `hsl(${Math.random() * 360}, 70%, 50%)`
  }
}

</script>

<style scoped>
.flex {
  --pulses: 0;

  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  height: 2rem;
  width: 100%;
  gap: 4px;
}

.sector {
  flex: 1 1 0;
  height: 100%;
}
</style>
