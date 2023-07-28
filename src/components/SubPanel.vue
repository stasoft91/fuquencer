<template>
  <div class="wrapper">
    <div class="primary-faders">
      <FaderInput :model-value="volumeLogToPercent(track.volume)"
                  :min="0"
                  :max="100"
                  @input="onUpdateVolume(volumePercentToLog($event.target?.value || 0))"
                  @dblclick="onUpdateVolume(-6.0)"
      />

      <ADSRForm :envelope="envelope" :is-sampler="isSampler" @update:envelope="onUpdateEnvelope" />

    </div>

    <EffectsChainComposer :effects-chain="effectsChain" @update:chain="onUpdateEffectsChain" :key="`${track.name}-${track.middlewares.length}`"></EffectsChainComposer>

     <button class="sidechain" @click="onSidechain">
       SIDECHAIN
     </button>


    <DisplayWaveform v-if="isSampler" :sample-name="track.name"></DisplayWaveform>
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
import {
  UniversalEffect,
} from "~/lib/Effects.types";
import {AVAILABLE_EFFECTS} from "@/constants";
import FaderInput from "@/components/ui/FaderInput.vue";

const props = defineProps<{
  track: Track,
  effectsChain: UniversalEffect[]
}>()

const emit = defineEmits<{
  (event: 'update:envelope', payload: ADSRType): void
  (event: 'update:volume', payload: number): void

  (event: 'update:sidechain', payload: undefined): void

  (event: 'update:chain', payload: string[]): void
}>()

const volumePercentToLog = (volumePercent: number) => {
  return Math.log10(volumePercent / 100) * 48
}

const volumeLogToPercent = (volumeLog: number) => {
  return Math.pow(10, volumeLog / 48) * 100
}

const onUpdateEnvelope = (envelope: ADSRType) => {
  emit('update:envelope', envelope)
}

const onUpdateVolume = (volume: number) => {
  emit('update:volume', volume)
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
}
</style>
