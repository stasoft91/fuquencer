<template>
  <div class="wrapper adsr-form">
    <div class="envelope-controls">
      <RichFaderInput
          class="constrained-width"
          label="Attack"
          id="attack"
          :default-value="1"
          :model-value="envelope.attack * 100"
          @update:model-value="onUpdateEnvelope(getEnvelopeWithChanges({ attack: $event / 100 }))"
      />


      <RichFaderInput
          class="constrained-width"
          v-if="!isSampler"
          label="Decay"
          id="decay"
          :default-value="25"
          :model-value="envelope.decay * 100"
          @update:model-value="onUpdateEnvelope(getEnvelopeWithChanges({ decay: $event/ 100 }))"
      />


      <RichFaderInput
          class="constrained-width"
          v-if="!isSampler"
          label="Sustain"
          id="sustain"
          :default-value="0"
          :model-value="envelope.sustain * 100"
          @update:model-value="onUpdateEnvelope(getEnvelopeWithChanges({ sustain: $event / 100 }))"
      />


      <RichFaderInput
          class="constrained-width"
          label="Release"
          id="release"
          :default-value="100"
          :model-value="envelope.release * 100"
          @update:model-value="onUpdateEnvelope(getEnvelopeWithChanges({ release: $event / 100 }))"
      />

      <div v-if="!isSampler" class="envelope-display" style="width: 200px;">
        <DisplayEnvelope
            :envelope="envelope"
            fill-color="rgba(100, 50, 200, 0.3)"
            stroke-color="rgba(200, 150, 50, 0.6)"
            :style="{ height: '50%', width: '100%' }"
        ></DisplayEnvelope>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DisplayEnvelope from '@/components/DisplayEnvelope/DisplayEnvelope.vue'
import type {ADSRType} from "~/lib/SoundEngine";
import FaderInput from "@/components/ui/FaderInput.vue";
import RichFaderInput from "@/components/ui/RichFaderInput.vue";
import {computed} from "vue";

const props = defineProps<{
  isSampler: boolean
  attack: number
  decay: number
  sustain: number
  release: number
}>()

const emit = defineEmits<{
  (event: 'update:envelope', payload: ADSRType): void
}>()

const envelope = computed<ADSRType>(() => {
  return {
    attack: props.attack,
    decay: props.decay,
    sustain: props.sustain,
    release: props.release
  }
})

const getEnvelopeWithChanges = (changes: Partial<ADSRType>) => {
  return {
    ...envelope.value,
    ...changes
  }
}

const onUpdateEnvelope = (envelope: ADSRType) => {
  emit('update:envelope', envelope)
}
</script>

<style scoped lang="scss">
.wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.envelope-controls {
  display: flex;
  flex-direction: row;
  align-items: stretch;

  justify-content: center;
  gap: 1rem;
}

.envelope-display {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

.constrained-width {
  width: 8rem;
}

</style>
