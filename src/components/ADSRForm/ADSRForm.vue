<template>
  <div class="wrapper adsr-form">
    <div class="envelope-controls envelope-controls__amplitude">
      <RichFaderInput
          class="constrained-width"
          label="Attack"
          id="attack"
          :default-value="1"
          :model-value="envelope.attack * 100"
          @update:model-value="onUpdateEnvelope(getEnvelopeWithChanges({ attack: $event / 100 }, envelope))"
          @click:link="onLinkClick('attack')"
      />


      <RichFaderInput
          class="constrained-width"
          label="Decay"
          id="decay"
          :default-value="25"
          :model-value="envelope.decay * 100"
          @update:model-value="onUpdateEnvelope(getEnvelopeWithChanges({ decay: $event/ 100 }, envelope))"
          @click:link="onLinkClick('decay')"
      />


      <RichFaderInput
          class="constrained-width"
          label="Sustain"
          id="sustain"
          :default-value="0"
          :model-value="envelope.sustain * 100"
          @update:model-value="onUpdateEnvelope(getEnvelopeWithChanges({ sustain: $event / 100 }, envelope))"
          @click:link="onLinkClick('sustain')"
      />


      <RichFaderInput
          class="constrained-width"
          label="Release"
          id="release"
          :default-value="100"
          :model-value="envelope.release * 100"
          @update:model-value="onUpdateEnvelope(getEnvelopeWithChanges({ release: $event / 100 }, envelope))"
          @click:link="onLinkClick('release')"
      />

      <div class="envelope-display" style="width: 200px;">
        <DisplayEnvelope
            :envelope="envelope"
            fill-color="rgba(100, 50, 200, 0.3)"
            stroke-color="rgba(200, 150, 50, 0.6)"
            :style="{ height: '50%', width: '100%' }"
        ></DisplayEnvelope>
      </div>
    </div>

    <div class="envelope-controls envelope-controls__filter">
      <RichFaderInput
          id="attack"
          :default-value="1"
          :min="1"
          :model-value="filterEnvelope.attack * 100"
          class="constrained-width"
          label="Attack"
          @update:model-value="onUpdateFilterEnvelope(getEnvelopeWithChanges({ attack: $event / 100 }, filterEnvelope))"
          @click:link="onLinkClick('attack')"
      />


      <RichFaderInput
          id="decay"
          :default-value="25"
          :min="1"
          :model-value="filterEnvelope.decay * 100"
          class="constrained-width"
          label="Decay"
          @update:model-value="onUpdateFilterEnvelope(getEnvelopeWithChanges({ decay: $event/ 100 }, filterEnvelope))"
          @click:link="onLinkClick('decay')"
      />


      <RichFaderInput
          id="sustain"
          :default-value="0"
          :model-value="filterEnvelope.sustain * 100"
          class="constrained-width"
          label="Sustain"
          @update:model-value="onUpdateFilterEnvelope(getEnvelopeWithChanges({ sustain: $event / 100 }, filterEnvelope))"
          @click:link="onLinkClick('sustain')"
      />


      <RichFaderInput
          id="release"
          :default-value="100"
          :model-value="filterEnvelope.release * 100"
          class="constrained-width"
          label="Release"
          @update:model-value="onUpdateFilterEnvelope(getEnvelopeWithChanges({ release: $event / 100 }, filterEnvelope))"
          @click:link="onLinkClick('release')"
      />

      <div class="envelope-display" style="width: 200px;">
        <DisplayEnvelope
            :envelope="filterEnvelope"
            :style="{ height: '50%', width: '100%' }"
            fill-color="rgba(100, 50, 200, 0.3)"
            stroke-color="rgba(200, 150, 50, 0.6)"
        ></DisplayEnvelope>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import DisplayEnvelope from '@/components/DisplayEnvelope/DisplayEnvelope.vue'
import type {ADSRType} from "~/lib/SoundEngine";
import RichFaderInput from "@/components/ui/RichFaderInput.vue";
import {computed} from "vue";
import type {Track} from "~/lib/Track";

const props = defineProps<{
  track: Track
}>()

const envelope = computed<ADSRType>(() => {
  const state = props.track.source.get()

  console.log(state)

  return {
    attack: props.track.meta.get('attack') ?? 0,
    decay: 0,
    sustain: 0,
    release: props.track.meta.get('release') ?? 1,
  }
})

const filterEnvelope = computed<ADSRType>(() => {
  return props.track.meta.get('filterEnvelope') || {
    attack: 1,
    decay: 0,
    sustain: 1,
    release: 0,
  }
})

const getEnvelopeWithChanges = (changes: Partial<ADSRType>, original: ADSRType) => {
  return {
    ...original,
    ...changes
  }
}

const onUpdateEnvelope = (envelope: ADSRType) => {
  props.track.setToSource('a', envelope.attack)
  props.track.setToSource('d', envelope.decay)
  props.track.setToSource('s', envelope.sustain)
  props.track.setToSource('r', envelope.release)
}

const onUpdateFilterEnvelope = (envelope: ADSRType) => {
  props.track.setToSource('filterEnvelope', envelope)
}

const onLinkClick = (param: string) => {
  alert('TODO: link ' + param)
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
