<template>
  <div class="wrapper">
    <div v-for="step in fraction" :key="step" :class="{'active': step <= progress}" class="progress-indicator"></div>
  </div>
</template>

<script lang="ts" setup>
import {onMounted, onUnmounted, ref, watch} from "vue";
import * as Tone from "tone/Tone";
import {getToneTimeNextMeasure} from "~/lib/utils/getToneTimeNextMeasure";


const props = defineProps<{
  interval: Tone.Unit.Time,
  isPlaying: boolean
}>()

const progress = ref(0)
let fraction = ref(0)
let loop: Tone.Loop | null = null;

onMounted(() => {
  initLoop()
})

onUnmounted(() => {
  stop()
  loop?.dispose()
  loop = null
})

watch(() => props.interval, () => {
  stop()

  loop?.dispose()
  loop = null
  initLoop()
})

const stop = () => {
  loop?.stop(Tone.Time('@2n').quantize('2n') as Tone.Unit.Time)
  progress.value = 0
}

const initLoop = () => {
  stop()
  loop?.dispose()
  loop = null

  const hasDot = Tone.Time(props.interval).toNotation().includes('.');

  const currentNotation = Tone.Time(props.interval).toNotation()
  const notationLetter = currentNotation.includes('n') ? 'n' : 'm'
  fraction.value = parseInt(currentNotation.split(notationLetter)[0]) - 1

  let interval = props.interval;

  if (fraction.value > 7) {
    fraction.value = 7
    interval = `4n${hasDot ? '.' : ''}` as Tone.Unit.Time
  }

  if (fraction.value < 3) {
    fraction.value = 3
  }

  if (fraction.value === 1) {
    fraction.value = 16
    interval = '16n'
  }

  loop = new Tone.Loop((time) => {
    if (!props.isPlaying) {
      return
    }

    progress.value = progress.value >= fraction.value ? 0 : progress.value + 1
  }, interval).start(getToneTimeNextMeasure())
}
</script>

<style scoped>
.progress-indicator {
  width: 0.25rem;
  height: 0.25rem;
  border-radius: 20%;
  background-color: var(--color-grey-700);
}

.progress-indicator.active {
  background-color: var(--color-grey-100);
  box-shadow: 0 0 0.25rem var(--color-grey-100);
}

.wrapper {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  flex: 1 0 0;
  width: 100%;
}
</style>
