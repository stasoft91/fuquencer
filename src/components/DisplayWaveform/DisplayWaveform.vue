<template>
  <div ref="wrapper" class="canvas-wrapper">
    <div ref="canvas" id="waveform"></div>
  </div>
</template>

<script setup lang="ts">
import {onMounted, onUnmounted, ref} from "vue";
import WaveSurfer from "wavesurfer.js";

const props = defineProps<{ }>();

const wrapper = ref<HTMLElement | null>(null);
const canvas = ref<HTMLElement | null>(null);
let resizeObserver: ResizeObserver | null = null;

onMounted(() => {
  const canvasElement = canvas.value;
  if (!canvasElement) {
    return;
  }

  drawWaveform();

  resizeObserver = new ResizeObserver(() => {
    drawWaveform();
  });

  if (wrapper.value) {
    resizeObserver.observe(wrapper.value as HTMLElement);
  }
});

onUnmounted(() => {
  if (resizeObserver && wrapper.value) {
    resizeObserver.unobserve(wrapper.value as HTMLElement);
  }
});

const drawWaveform = () => {
  const wavesurfer = WaveSurfer.create({
    container: '#waveform',
    waveColor: '#4F4A85',
    progressColor: '#383351',
    url: '/samples/kick.wav',
    autoplay: false,
    interact: false
  })
}

</script>