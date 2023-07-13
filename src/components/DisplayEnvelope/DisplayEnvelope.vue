<template>
  <div ref="wrapper" class="canvas-wrapper">
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script lang="ts" setup>
  import {ref, onMounted, onUnmounted, onUpdated} from 'vue';
  import type {DisplayEnvelopeProps} from "@/components/DisplayEnvelope/DisplayEnvelope.types";

  const props = defineProps<DisplayEnvelopeProps>();

  const wrapper = ref<HTMLElement | null>(null);
  const canvas = ref<HTMLCanvasElement | null>(null);
  let canvasContext: CanvasRenderingContext2D | null | undefined = null;
  let resizeObserver: ResizeObserver | null = null;

  const drawADSR = () => {
    if (!props.envelope) {
      console.log('Envelope is required');
      return;
    }

    const canvasElement = canvas.value;
    const wrapperElement = wrapper.value;

    const envelope: {
      attackTime: number;
      decayTime: number;
      sustainLevel: number;
      releaseTime: number;
    } = {
      attackTime: props.envelope.attack! as number,
      decayTime: props.envelope.decay! as number,
      sustainLevel: props.envelope.sustain! as number,
      releaseTime: props.envelope.release! as number,
    };

    if (!canvasElement || !wrapperElement || !canvasContext) {
      return;
    }

    if (!envelope.attackTime || !envelope.decayTime || !envelope.sustainLevel || !envelope.releaseTime ) {
      return;
    }

    const width = wrapperElement.offsetWidth;
    const height = wrapperElement.offsetHeight;

    canvasElement.width = width;
    canvasElement.height = height;
    canvasContext.clearRect(0, 0, width, height);

    canvasContext.lineWidth = 2;
    canvasContext.strokeStyle = 'red';

    canvasContext.moveTo(0, height);

    // Draw Attack
    const attackEndTime: number = envelope.attackTime * width;
    canvasContext.lineTo(attackEndTime, 0);

    // Draw Decay
    const decayEndTime = attackEndTime + envelope.decayTime * width;
    const sustainLevel = height - (height * envelope.sustainLevel);
    canvasContext.lineTo(decayEndTime, sustainLevel);

    // Draw Sustain
    const sustainEndTime = decayEndTime + envelope.sustainLevel * width;
    canvasContext.lineTo(sustainEndTime, sustainLevel);

    // Draw Release
    const releaseEndTime = sustainEndTime + envelope.releaseTime * width;
    canvasContext.lineTo(releaseEndTime, height);


    canvasContext.stroke();
  };

  onUpdated(() => {
    drawADSR();
  });

  onMounted(() => {
    const canvasElement = canvas.value;
    if (!canvasElement) {
      return;
    }

    canvasContext = canvasElement.getContext("2d");
    drawADSR();

    resizeObserver = new ResizeObserver(() => {
      drawADSR();
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
</script>

<style scoped>
.canvas-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  overflow: hidden;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}
</style>