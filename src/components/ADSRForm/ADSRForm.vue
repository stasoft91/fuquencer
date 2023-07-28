<template>
  <div class="wrapper adsr-form">
    <div class="envelope-controls">
      <div class="envelope-control">
        <label for="attack">Attack</label>
        <FaderInput :model-value="envelope.attack * 100"
                    :min="0"
                    :max="100"
                    id="attack"
                    @input="onUpdateEnvelope(getEnvelopeWithChanges({ attack: parseFloat($event.target?.value || '0') / 100 }))"
        />

        <input type="number"
               min="0"
               max="1"
               step="0.01"
               :value="envelope.attack"
               @input="onUpdateEnvelope(getEnvelopeWithChanges({ attack: parseFloat($event.target?.value || '0') }))"
        />
      </div>
      <div v-if="!isSampler" class="envelope-control">
        <label for="decay">Decay</label>
        <FaderInput :model-value="envelope.decay * 100"
                    :min="0"
                    :max="100"
                    id="decay"
                    @input="onUpdateEnvelope(getEnvelopeWithChanges({ decay: parseFloat($event.target?.value || '0') / 100 }))"
        />

        <input type="number"
               min="0"
               max="1"
               step="0.01"
               :value="envelope.decay"
               @input="onUpdateEnvelope(getEnvelopeWithChanges({ decay: parseFloat($event.target?.value || '0') }))"
        />
      </div>
      <div v-if="!isSampler" class="envelope-control">
        <label for="sustain">Sustain</label>
        <FaderInput :model-value="envelope.sustain * 100"
                    :min="0"
                    :max="100"
                    id="sustain"
                    @input="onUpdateEnvelope(getEnvelopeWithChanges({ sustain: parseFloat($event.target?.value || '0') / 100 }))"
        />

        <input type="number"
               min="0"
               max="1"
               step="0.01"
               :value="envelope.sustain"
               @input="onUpdateEnvelope(getEnvelopeWithChanges({ sustain: parseFloat($event.target?.value || '0') }))"
        />
      </div>
      <div class="envelope-control">
        <label for="release">Release</label>
        <FaderInput :model-value="envelope.release * 100"
                    :min="0"
                    :max="100"
                    id="release"
                    @input="onUpdateEnvelope(getEnvelopeWithChanges({ release: parseFloat($event.target?.value || '0') / 100 }))"
        />

        <input type="number"
               min="0"
               max="1"
               step="0.01"
               :value="envelope.release"
               @input="onUpdateEnvelope(getEnvelopeWithChanges({ release: parseFloat($event.target?.value || '0') }))"
        />
      </div>

      <div v-if="!isSampler" class="envelope-display" style="width: 100px;">
        <DisplayEnvelope
            :envelope="envelope"
            fill-color="rgba(100, 50, 200, 0.3)"
            stroke-color="rgba(200, 150, 50, 0.6)"
            :style="{ height: '100%', width: '100%' }"
        ></DisplayEnvelope>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DisplayEnvelope from '@/components/DisplayEnvelope/DisplayEnvelope.vue'
import type {ADSRType} from "~/lib/SoundEngine";
import FaderInput from "@/components/ui/FaderInput.vue";

const props = defineProps<{
  isSampler: boolean
  envelope: ADSRType
}>()

const emit = defineEmits<{
  (event: 'update:envelope', payload: ADSRType): void
}>()

const getEnvelopeWithChanges = (changes: Partial<ADSRType>) => {
  return {
    ...props.envelope,
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
  gap: 1rem;
}

.envelope-controls {
  display: flex;
  flex-direction: row;
  align-items: stretch;

  justify-content: center;
}

.envelope-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.envelope-display {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

</style>
