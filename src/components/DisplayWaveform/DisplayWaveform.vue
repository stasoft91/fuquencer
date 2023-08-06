<template>
  <div ref="wrapper" class="canvas-wrapper">
    <div ref="canvas" :id="sampleName"></div>
  </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, onUpdated, ref} from 'vue'
import WaveSurfer from 'wavesurfer.js'

type Props = {
  sampleName: string,
  waveColor?: string
}
const props = defineProps<Props>()

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
  if (!props.sampleName) {
    return
  }

  wavesurfer?.destroy()

  wavesurfer = WaveSurfer.create({
    container: canvas.value as HTMLElement,
    waveColor: props.waveColor,
    progressColor: '#ffffff00',
    url: 'samples/' + props.sampleName,
    autoplay: false,
    interact: false,
    height: 16
  })
}
</script>
