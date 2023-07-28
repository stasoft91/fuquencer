<template>
  <div ref="wrapper" class="canvas-wrapper">
    <div ref="canvas" id="waveform"></div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onBeforeUnmount, ref, onUpdated} from 'vue'
import WaveSurfer from 'wavesurfer.js'

const props = defineProps<{sampleName: string}>()

const wrapper = ref<HTMLElement | null>(null)
const canvas = ref<HTMLElement | null>(null)
let resizeObserver: ResizeObserver | null = null
let wavesurfer: WaveSurfer | null = null

onMounted(() => {
  const canvasElement = canvas.value
  if (!canvasElement) {
    return
  }

  drawWaveform()

  resizeObserver = new ResizeObserver(() => {
    drawWaveform()
  })

  if (wrapper.value) {
    resizeObserver.observe(wrapper.value as HTMLElement)
  }
})

onUpdated(() => {
    drawWaveform()
})

onBeforeUnmount(() => {
  if (resizeObserver && wrapper.value) {
    resizeObserver.unobserve(wrapper.value as HTMLElement)
  }
})

const drawWaveform = () => {
  wavesurfer?.destroy()
  wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#4F4A85',
    progressColor: '#383351',
    url: 'samples/' + props.sampleName,
    autoplay: false,
    interact: false
  })
}
</script>
