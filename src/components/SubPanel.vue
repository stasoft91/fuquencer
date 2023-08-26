<template>
  <div class="wrapper">
    <n-card :title="props.track.name">
      <div class="primary-faders">
        <div class="grow">
          <div id="analyzer"></div>
        </div>
      </div>
      <div class="primary-faders">
        <div class="columns grow">
          <div class="column flex-start grow">
            <div class="columns grow">
              <SimpleButton v-for="i in [2,4,8,16]" :key="i" class="grow big" @click="onFillTrack(i)">Fill x{{ i }}
              </SimpleButton>
            </div>

            <div class="columns grow">
              <SimpleButton class="grow big" @click="onShiftTrackLeft">Shift Left</SimpleButton>
              <SimpleButton class="grow big" @click="onShiftTrackRight">Shift Right</SimpleButton>
            </div>

            <div class="columns grow">
              <SimpleButton class="grow big" @click="onFillTrack()">Clear</SimpleButton>
              <SimpleButton class="grow long" @click="onHumanizeTrack">Humanize</SimpleButton>
            </div>
          </div>
          <div v-if="track.type === TrackTypes.sample" class="column grow">
            <SampleEditorButton
                :sampleUrl="selectedSampleUrl"
                :track="track"
                color="rgba(26, 32, 44, 1)"
                width="100%"
            >
              Change
            </SampleEditorButton>
          </div>
          <div v-if="track.type === TrackTypes.synth" class="column grow">
            <SimpleButton class="grow big long" @click="onGenerateBassline">Generate new bassline</SimpleButton>
          </div>
        </div>
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
                v-if="hasCutoff"
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
              :effects-chain="track.middlewares"
              :selected-track-name="track.name"
              @update:chain="onUpdateEffectsChain"
          ></EffectsChainComposer>
        </n-tab-pane>
        <n-tab-pane class="polyrythms-tab" name="polyrhythm" tab="POLYRHYTHMS">
          <SimpleButton @click="onAddPolyrhythm"> Add Polyrythm</SimpleButton>
          <div v-for="loop in (track.getLoops().value)" :key="loop.name" class="polyrythm-card">
            <beat-display :interval="loop.interval" :is-playing="loop.isRunning"></beat-display>

            <div v-if="!loop.isAutomation.value" class="polyrhythm-card-row">
              <span>Note</span>
              <div class="width100px">
                <select :value="loop.note" class="select" @change="onLoopUpdate(loop, 'note', $event)">
                  <option v-for="note in AVAILABLE_NOTES" :key="note" :value="note">{{ note }}</option>
                </select>
              </div>
            </div>
            <div v-if="loop.isAutomation.value" class="polyrhythm-card-row">
              <span><h2>Automation</h2></span>
            </div>

            <div class="polyrhythm-card-row">
              <div>Duration</div>
              <div class="width100px">
                <select
                    :value="Tone.Time(loop.duration).toNotation()"
                    class="select"
                    @change="onLoopUpdate(loop, 'duration', $event)"
                >
                  <option v-for="time in DELAY_OPTIONS" :key="time" :value="time">{{ time }}</option>
                </select>
              </div>
            </div>

            <div class="polyrhythm-card-row">
              <div>Interval</div>
              <div class="width100px">
                <select
                    :value="Tone.Time(loop.interval).toNotation()"
                    class="select"
                    @change="onLoopUpdate(loop, 'interval', $event)"
                >
                  <option v-for="time in DELAY_OPTIONS" :key="time" :value="time">{{ time }}</option>
                </select>
              </div>
            </div>

            <div class="polyrhythm-card-row">
              <div>Humanize</div>
              <div class="width100px">
                <div class="width100px">
                  <select
                      :value="Tone.Time(loop.humanize as Tone.Unit.Time).toNotation()"
                      class="select"
                      @change="onLoopUpdate(loop, 'humanize', $event)"
                  >
                    <option v-for="time in DELAY_OPTIONS_WITH_ZERO" :key="time" :value="time">{{ time }}</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="polyrhythm-card-row">
              <div>Probability</div>
              <div class="width100px">
                <div class="width100px">
                  <select
                      :value="loop.probability"
                      class="select"
                      @change="onLoopUpdate(loop, 'probability', $event)"
                  >
                    <option v-for="probability in [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]"
                            :key="probability" :value="probability">{{ probability }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="polyrhythm-card-row">
              <div>Status</div>
              <div class="horizontal">
                {{ loop.isRunning ? 'Playing' : 'Stopped' }}
                <div :class="{'active': loop.isRunning}" class="circle"></div>
              </div>
            </div>

            <div class="polyrhythm-card-row">
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
import {NCard, NSwitch, NTabPane, NTabs} from 'naive-ui';
import ADSRForm from '@/components/ADSRForm/ADSRForm.vue'
import BeatDisplay from '@/components/ui/BeatDisplay.vue'
import {TrackTypes} from "~/lib/SoundEngine";
import {computed} from "vue";
import type {Track} from "~/lib/Track";
import EffectsChainComposer from "@/components/EffectsChainComposer.vue";
import RichFaderInput from "@/components/ui/RichFaderInput.vue";
import SimpleButton from "@/components/ui/SimpleButton.vue";
import {AVAILABLE_NOTES, DEFAULT_NOTE, Sequencer} from "~/lib/Sequencer";
import {DELAY_OPTIONS, DELAY_OPTIONS_WITH_ZERO} from "@/constants";
import type {LoopParams, PolyrhythmLoop} from "~/lib/PolyrhythmLoop";
import * as Tone from "tone/Tone";
import {getToneTimeNextMeasure} from "~/lib/utils/getToneTimeNextMeasure";
import SampleEditorButton from "@/components/SampleEditor/SampleButton.vue";

const props = defineProps<{
  track: Track,
}>()

const emit = defineEmits<{
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

const hasCutoff = computed<boolean>(() => {
  return 'filterEnvelope' in props.track.source.get()
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
  // decide where in $event we have actual value (is $event a string or Event object)
  const value: string = Object.getOwnPropertyNames($event).includes('isTrusted') ? (($event as InputEvent).target as HTMLInputElement).value : $event as string

  loop.set({
    [fieldName]: value,
  });
}

const hasDuckingEnabled = computed<boolean>(() => {
  return Boolean(props.track.middlewares.find(middleware => middleware.name === 'AutoDuck'))
})

const onStartLoop = (loop: PolyrhythmLoop) => {
  const quantizedTime = getToneTimeNextMeasure()
  loop.start(quantizedTime)
}

const onStopLoop = (loop: PolyrhythmLoop) => {
  const quantizedTime = getToneTimeNextMeasure()

  loop.stop(quantizedTime)
}

const onFillTrack = (repeats?: number) => {
  const sequencer = Sequencer.getInstance()
  const trackNumber = sequencer.soundEngine.tracks.findIndex(track => track === props.track) + 1

  for (let i = 1; i <= 16; i++) {
    sequencer.writeCell(Sequencer.cell(trackNumber, i, {
      velocity: 0,
      note: DEFAULT_NOTE,
    }))
  }

  if (!repeats) {
    return
  }

  const step = 16 / repeats;

  for (let i = 1; i <= 16; i += step) {
    sequencer.writeCell(Sequencer.cell(trackNumber, i, {
      velocity: 100,
      note: DEFAULT_NOTE,
    }))
  }
}

const onShiftTrackLeft = () => {
  const sequencer = Sequencer.getInstance()
  const trackIndex = sequencer.soundEngine.tracks.findIndex(track => track === props.track) + 1

  sequencer.sequenceGrid.value.filter(_ => _.row === trackIndex).forEach((cellPosition) => {
    const nextCellPosition = cellPosition.column === 1 ? 16 : cellPosition.column - 1
    const newCell = Sequencer.cell(trackIndex, nextCellPosition, cellPosition)
    sequencer.writeCell(newCell)
  })
}
const onShiftTrackRight = () => {
  const sequencer = Sequencer.getInstance()
  const trackIndex = sequencer.soundEngine.tracks.findIndex(track => track === props.track) + 1

  sequencer.sequenceGrid.value.filter(_ => _.row === trackIndex).forEach((cellPosition) => {
    const nextCellPosition = cellPosition.column === 16 ? 1 : cellPosition.column + 1
    const newCell = Sequencer.cell(trackIndex, nextCellPosition, cellPosition)
    sequencer.writeCell(newCell)
  })
}

const onHumanizeTrack = () => {
  const sequencer = Sequencer.getInstance()
  const trackIndex = sequencer.soundEngine.tracks.findIndex(track => track === props.track) + 1

  sequencer.sequenceGrid.value.filter(_ => _.row === trackIndex).forEach((cellPosition) => {
    let newVelocity = Math.ceil(Math.random() * 25) + 75
    newVelocity = newVelocity < 0 ? 0 : newVelocity
    newVelocity = newVelocity > 100 ? 100 : newVelocity

    const newCell = Sequencer.cell(trackIndex, cellPosition.column, {
      ...cellPosition,
      velocity: cellPosition.velocity > 0 ? newVelocity : 0,
    })
    sequencer.writeCell(newCell)
  })
}

const onGenerateBassline = () => {
  const sequencer = Sequencer.getInstance()
  const trackIndex = sequencer.soundEngine.tracks.findIndex(track => track === props.track) + 1
  //['C2', 'B2', 'E2', 'F2'], ['D2', 'A2', 'C2', 'B2']
  sequencer.regenerateSequence(trackIndex, ['C2', 'B2', 'E2', 'F2', 'B1'])
}

const selectedSampleUrl = computed(() => props.track.meta.get('urls')[DEFAULT_NOTE] || (props.track.source.get() as Tone.SamplerOptions).urls[DEFAULT_NOTE])
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

.polyrhythm-card-row {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.polyrhythm-card-row .select {
  outline: none;
  border: none;
  background: (var(--color-grey-300));
  padding: 0.5rem;
  width: 100%;
}

.polyrhythm-card-row .select option {
  padding: 1rem;
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

.columns {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.column {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.flex-start {
  align-items: flex-start;
  justify-content: flex-start;
}

.grow {
  flex: 1 1 100%;
}

.big {
  width: 5rem !important;
  height: 3rem !important;
}

.long {
  width: 8rem !important;
  height: 3rem !important;
}
</style>
