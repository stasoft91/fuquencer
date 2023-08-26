<template>
  <div ref="wrapper" class="canvas-wrapper">
    <div :id="(id ?? '') + url" ref="canvas"></div>
  </div>
</template>

<script setup lang="ts">
import {onBeforeUnmount, onMounted, onUpdated, ref} from 'vue'
import WaveSurfer from 'wavesurfer.js'

type Props = {
  id?: string,
  url: string,

  waveColor?: string,
  height?: number,
  normalize?: boolean,
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

const drawWaveform = async () => {
  if (!props.url) {
    return
  }

  wavesurfer?.destroy()

  wavesurfer = WaveSurfer.create({
    container: canvas.value as HTMLElement,
    waveColor: props.waveColor,
    progressColor: '#ffffff00',

    url: props.url,
    autoplay: false,
    interact: false,
    normalize: props.normalize,
    height: props.height ?? 16
  })
}
</script>
