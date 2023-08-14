<template>
  <div class="wrapper">
    <n-card :title="props.track.name">
      <div v-if="track.type === TrackTypes.sample" class="primary-faders">
        <SampleEditorButton :key="track.meta.get('url') as string" :track="track" color="rgba(26, 32, 44, 1)"/>
      </div>
      <n-tabs animated type="line">
        <n-tab-pane name="instrument" tab="INSTRUMENT">
          <div class="primary-faders">
            <RichFaderInput
                :default-value="75"
                :max="120"
                :min="0"
                :model-value="volumeLogToPercent(parseFloat(track.meta.get('volume') as string))"
                class="constrained-width"
                label="Volume"
                @update:model-value="onUpdateVolume(volumePercentToLog($event))"
            />

            <RichFaderInput
                v-if="'filterEnvelope' in track.source.get()"
                :default-value="50"
                :max="100"
                :min="0"
                :model-value="herzToPercent(track.meta.get('filterEnvelope')?.baseFrequency)"
                class="constrained-width"
                label="Cut-off"
                @update:model-value="onUpdateFilter(percentToHerz($event as number))"
            />

            <ADSRForm :track="track"/>
          </div>
        </n-tab-pane>

        <n-tab-pane name="effects" tab="EFFECTS">
          <n-switch :size="'large'" :value="hasDuckingEnabled" @update:value="onToggleSidechain">
            <template #checked>
              AutoDuck ON
            </template>
            <template #unchecked>
              AutoDuck OFF
            </template>
          </n-switch>

          <EffectsChainComposer
              :key="`${track.name}-${track.middlewares.length}`"
              :effects-chain="effectsChain"
              :selected-track-name="track.name"
              @update:chain="onUpdateEffectsChain"
          ></EffectsChainComposer>
        </n-tab-pane>
        <n-tab-pane class="polyrythms-tab" name="polyrhythm" tab="POLYRHYTHMS">
          <SimpleButton @click="onAddPolyrhythm"> Add Polyrythm</SimpleButton>
          <div v-for="loop in (track.getLoops().value)" :key="loop.name" class="polyrythm-card">
            <beat-display :interval="loop.interval" :is-playing="loop.isRunning"></beat-display>

            <div class="polyrythm-card-row">
              <span>Note</span>
              <div class="width100px">
                <select :value="loop.note" class="select-note" @change="onLoopUpdate(loop, 'note', $event)">
                  <option v-for="note in AVAILABLE_NOTES" :key="note" :value="note">{{ note }}</option>
                </select>
              </div>
            </div>

            <div class="polyrythm-card-row">
              <div>Duration</div>
              <div class="width100px">
                <n-select :options="DELAY_OPTIONS.map(_=>({label: _, value: _}))"
                          :value="Tone.Time(loop.duration).toNotation()"
                          @update:value="onLoopUpdate(loop, 'duration', $event)"/>
              </div>
            </div>

            <div class="polyrythm-card-row">
              <div>Interval</div>
              <div class="width100px">
                <n-select :options="DELAY_OPTIONS.map(_=>({label: _, value: _}))"
                          :value="Tone.Time(loop.interval).toNotation()"
                          @update:value="onLoopUpdate(loop, 'interval', $event)"/>
              </div>
            </div>

            <div class="polyrythm-card-row">
              <div>Humanize</div>
              <div class="width100px">
                <div class="width100px">
                  <n-select :options="DELAY_OPTIONS_WITH_ZERO.map(_=>({label: _, value: _}))"
                            :value="Tone.Time(loop.humanize as Tone.Unit.Time).toNotation()"
                            @update:value="onLoopUpdate(loop, 'humanize', $event)"/>
                </div>
              </div>
            </div>

            <div class="polyrythm-card-row">
              <div>Probability</div>
              <div class="width100px">
                <div class="width100px">
                  <n-select
                      :options="[0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(_=>({label: _.toString(), value: _.toString()}))"
                      :value="loop.probability" @update:value="onLoopUpdate(loop, 'probability', $event)"/>
                </div>
              </div>
            </div>

            <div class="polyrythm-card-row">
              <div>Status</div>
              <div class="horizontal">
                {{ loop.isRunning ? 'Playing' : 'Stopped' }}
                <div :class="{'active': loop.isRunning}" class="circle"></div>
              </div>
            </div>

            <div class="polyrythm-card-row">
              <SimpleButton @click="onStartLoop(loop)"> start</SimpleButton>
              <SimpleButton @click="onStopLoop(loop)"> stop</SimpleButton>
              <SimpleButton @click="() => loop.remove()"> remove</SimpleButton>
            </div>
          </div>
        </n-tab-pane>
      </n-tabs>
    </n-card>
  </div>
</template>

<script lang="ts" setup>
import {NCard, NSelect, NSwitch, NTabPane, NTabs} from 'naive-ui';
import ADSRForm from '@/components/ADSRForm/ADSRForm.vue'
import BeatDisplay from '@/components/ui/BeatDisplay.vue'
import type {ADSRType} from "~/lib/SoundEngine";
import {TrackTypes} from "~/lib/SoundEngine";
import {computed} from "vue";
import type {Track} from "~/lib/Track";
import EffectsChainComposer from "@/components/EffectsChainComposer.vue";
import type {UniversalEffect,} from "~/lib/Effects.types";
import RichFaderInput from "@/components/ui/RichFaderInput.vue";
import SimpleButton from "@/components/ui/SimpleButton.vue";
import {AVAILABLE_NOTES} from "~/lib/Sequencer";
import {DELAY_OPTIONS, DELAY_OPTIONS_WITH_ZERO} from "@/constants";
import type {LoopParams, PolyrhythmLoop} from "~/lib/PolyrhythmLoop";
import * as Tone from "tone/Tone";
import {getToneTimeNextMeasure} from "~/lib/utils/getToneTimeNextMeasure";
import SampleEditorButton from "@/components/SampleEditor/SampleEditorButton.vue";

const props = defineProps<{
  track: Track,
  effectsChain: UniversalEffect[]
}>()

const emit = defineEmits<{
  (event: 'update:envelope', payload: ADSRType): void

  (event: 'update:sidechain', payload: undefined): void

  (event: 'update:chain', payload: string[]): void
}>()

const volumePercentToLog = (volumePercent: number) => {
  return Math.log10(volumePercent / 100) * 48
}

const volumeLogToPercent = (volumeLog: number) => {
  return Math.pow(10, volumeLog / 48) * 100
}

//scale between 20 and 20000 exponentially to 0 and 100
const herzToPercent = (herz: number | string) => {
  if (typeof herz === 'string') {
    herz = parseFloat(herz)
  }
  return Math.log10(herz)*23.2
}

const percentToHerz = (percent: number) => {
  return Math.pow(10, percent/23.2)
}

const onUpdateVolume = ( volume: number) => {
  props.track.set('volume', volume)
}

const onUpdateFilter = (frequency: number) => {
  props.track.set({
    filterEnvelope: {
      baseFrequency: frequency
    }
  })
}

const onUpdateEffectsChain = (chain: string[]) => {
  emit('update:chain', chain)
}

const isSampler = computed<boolean>(() => {
  return props.track.type === TrackTypes.sample
})

const envelope = computed<ADSRType>(() => {
  return props.track.meta.has('envelope') ? props.track.meta.get('envelope') : {
    attack: props.track.meta.get('attack') ?? 0,
    decay: 0,
    sustain: 0,
    release: props.track.meta.get('release') ?? 0,
  }
})

const hasCutoff = computed<boolean>(() => {
  return 'filterEnvelope' in props.track
})

const onToggleSidechain = () => {
  emit('update:sidechain', undefined)
}

const onAddPolyrhythm = (): void => {
  props.track.addLoop({
    interval: '16n'
  })
}

const onLoopUpdate = (loop: PolyrhythmLoop, fieldName: keyof LoopParams, $event: string | Event) => {
  // decide where in $event we have actual value
  const value: string = Object.getOwnPropertyNames($event).includes('isTrusted') ? (($event as InputEvent).target as HTMLInputElement).value : $event as string

  console.log('onLoopUpdate', fieldName, value)

  loop.set({
    [fieldName]: value,
  });
}

const hasDuckingEnabled = computed<boolean>(() => {
  return props.track.middlewares.find(middleware => middleware.name === 'AutoDuck') !== undefined
})

const onStartLoop = (loop: PolyrhythmLoop) => {
  loop.start(getToneTimeNextMeasure())
}

const onStopLoop = (loop: PolyrhythmLoop) => {
  loop.stop(getToneTimeNextMeasure())
}
</script>

<style lang="scss">
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

.polyrythms-tab {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 2rem;
}

.polyrythm-card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 1rem;

  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid var(--color-grey-600);
}

.polyrythm-card-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.polyrythm-card-row .select-note {
  outline: none;
  border: none;
  background: (var(--color-grey-300));
  padding: 0.5rem;
  width: 100%;
}

.circle {
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background: hsl(689, 67%, 51%);
  transition: background 0.2s ease-in-out;
  box-shadow: 0 0 0.5rem hsl(689, 67%, 51%);
}

.circle.active {
  background: hsl(89, 67%, 51%);
  box-shadow: 0 0 0.5rem hsl(89, 67%, 51%);
}

.horizontal {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.width100px {
  flex-basis: 100px;
}
</style>
