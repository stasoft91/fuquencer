<template>
  <div class="wrapper">
    <div class="primary-faders">
      <RichFaderInput
          class="constrained-width"
          :default-value="75"
          label="Volume"
          :min="0"
          :max="100"
          :model-value="volumeLogToPercent(track.volume)"
          @update:model-value="onUpdateVolume(volumePercentToLog($event))"
      />

      <RichFaderInput
          v-if="track.source.filterEnvelope"
          class="constrained-width"
          label="Cut-off"
          :min="0"
          :max="100"
          :default-value="herzToPercent(track.source.filterEnvelope.baseFrequency as number)"
          :model-value="herzToPercent(track.filterEnvelopeFrequency)"
          @update:model-value="onUpdateFilter(percentToHerz($event as number))"
      />

      <ADSRForm :attack="envelope.attack" :decay="envelope.decay" :release="envelope.release" :sustain="envelope.sustain" :is-sampler="isSampler" @update:envelope="onUpdateEnvelope" />
    </div>

    <SimpleButton class="sidechain" @click="onSidechain">
      Enable AutoDuck
    </SimpleButton>

    <EffectsChainComposer :effects-chain="effectsChain" @update:chain="onUpdateEffectsChain" :key="`${track.name}-${track.middlewares.length}`"></EffectsChainComposer>
  </div>
</template>

<script lang="ts" setup>
import ADSRForm from '@/components/ADSRForm/ADSRForm.vue'
import DisplayWaveform from '@/components/DisplayWaveform/DisplayWaveform.vue'
import type {ADSRType} from "~/lib/SoundEngine";
import {TrackTypes} from "~/lib/SoundEngine";
import {computed} from "vue";
import type {Track} from "~/lib/Track";
import EffectsChainComposer from "@/components/EffectsChainComposer.vue";
import type {
  UniversalEffect,
} from "~/lib/Effects.types";
import RichFaderInput from "@/components/ui/RichFaderInput.vue";
import SimpleButton from "@/components/ui/SimpleButton.vue";

const props = defineProps<{
  track: Track,
  effectsChain: UniversalEffect[]
}>()

const emit = defineEmits<{
  (event: 'update:envelope', payload: ADSRType): void
  (event: 'update:volume', payload: number): void

  (event: 'update:sidechain', payload: undefined): void

  (event: 'update:chain', payload: string[]): void
  (event: 'update:filter', payload: number): void
}>()

const volumePercentToLog = (volumePercent: number) => {
  return Math.log10(volumePercent / 100) * 48
}

const volumeLogToPercent = (volumeLog: number) => {
  return Math.pow(10, volumeLog / 48) * 100
}

//scale between 20 and 20000 exponentially to 0 and 100
const herzToPercent = (herz: number) => {
  return Math.log10(herz)*23.2
}

const percentToHerz = (percent: number) => {
  return Math.pow(10, percent/23.2)
}

const onUpdateEnvelope = (envelope: ADSRType) => {
  emit('update:envelope', envelope)
}

const onUpdateVolume = ( volume: number) => {
  emit('update:volume', volume)
}

const onUpdateFilter = ( herz: number) => {
  emit('update:filter', herz)
}

const onUpdateEffectsChain = (chain: string[]) => {
  emit('update:chain', chain)
}

const isSampler = computed<boolean>(() => {
  return props.track.type === TrackTypes.sample
})

const envelope = computed<ADSRType>(() => {
  return props.track.envelope
})

const onSidechain = () => {
  emit('update:sidechain', undefined)
}
</script>

<style>
.primary-faders {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  margin-bottom: 2rem;
  gap: 1rem;
}

.constrained-width {
  width: 8rem;
}
</style>
