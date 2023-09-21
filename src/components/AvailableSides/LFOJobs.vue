<template>
  <div class="lfo-jobs-wrapper">
    <h2>LFO Jobs</h2>

    <div class="lfos">
      <div
          v-for="lfo in sequencer.LFOs.value"
          :key="lfo.id"
          class="lfo"
      >
        <div class="lfo__param lfo__is-running">run:{{ lfo.isRunning }}</div>
        <div class="lfo__param lfo__frequency">
          <label :for="`${lfo.id}_freq`">freq</label>

          <select
              :id="`${lfo.id}_freq`"
              @change="onFrequencyChange(lfo, $event)"
          >
            <option
                v-for="option in [...DELAY_OPTIONS_LONG, ...DELAY_OPTIONS]"
                :key="option"
                :selected="toMeasure(Tone.Time(lfo.frequency, 'hz')) === toMeasure(option)"
                :value="option">
              {{ toMeasure(option) }}
            </option>
          </select>
        </div>
        <div class="lfo__param lfo__type">
          <label :for="`${lfo.id}_type`">type</label>

          <select
              :id="`${lfo.id}_type`"
              @change="onTypeChange(lfo, $event)"
          >
            <option
                v-for="option in ['oneshot', 'random', 'sine', 'square', 'triangle', 'sawtooth']"
                :key="option"
                :selected="lfo.type === option"
                :value="option">
              {{ option }}
            </option>
          </select>
        </div>
        <div class="lfo__param lfo__min">
          <label :for="`${lfo.id}_min`">min</label>

          <input
              :id="`${lfo.id}_min`"
              :value="lfo.min"
              type="number"
              @change="onMinChange(lfo, $event)"
          />
        </div>
        <div class="lfo__param lfo__max">
          <label :for="`${lfo.id}_max`">max</label>
          <input
              :id="`${lfo.id}_max`"
              :value="lfo.max"
              type="number"
              @change="onMaxChange(lfo, $event)"
          />
        </div>
        <div class="lfo__param lfo__destination">{{ lfo.title }}</div>

        <div class="lfo__actions">
          <button
              :disabled="lfo.isRunning"
              class="btn-start"
              @click="start(lfo)"
          >
            <NIcon :component="PlayIcon"></NIcon>
          </button>
          <button
              :disabled="!lfo.isRunning"
              class="btn-stop"
              @click="stop(lfo)"
          >
            <NIcon :component="StopIcon"></NIcon>
          </button>
          <button
              class="btn-delete"
              @click="onBtnDeleteClick(lfo)"
          >
            <NIcon :component="DeleteIcon"></NIcon>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {triggerRef} from 'vue'
import {NIcon} from "naive-ui";
import {Play as PlayIcon, Stop as StopIcon, Trash as DeleteIcon} from "@vicons/ionicons5";
import type {LFOType} from "~/lib/LFO";
import {LFO} from "~/lib/LFO";
import {Sequencer} from "~/lib/Sequencer";
import * as Tone from "tone/Tone";
import {getToneTimeNextMeasure} from "~/lib/utils/getToneTimeNextMeasure";
import {DELAY_OPTIONS, DELAY_OPTIONS_LONG} from "@/constants";
import {toMeasure} from "~/lib/utils/toMeasure";


const sequencer = Sequencer.getInstance()

const start = (lfo: LFO) => {
  const timeRaw = getToneTimeNextMeasure()
  lfo.start(timeRaw)
  triggerRef(sequencer.LFOs)
}

const stop = (lfo: LFO) => {
  const timeRaw = getToneTimeNextMeasure()
  lfo.stop(timeRaw)
  triggerRef(sequencer.LFOs)
}

const onFrequencyChange = (lfo: LFO, $ev: Event) => {
  lfo.frequency = Tone.Time(($ev.target as HTMLInputElement).value).toFrequency()
  triggerRef(sequencer.LFOs)
}

const onTypeChange = (lfo: LFO, $ev: Event) => {
  lfo.type = ($ev.target as HTMLInputElement).value as LFOType
  triggerRef(sequencer.LFOs)
}

const onMinChange = (lfo: LFO, $ev: Event) => {
  lfo.min = Number(($ev.target as HTMLInputElement).value)
  triggerRef(sequencer.LFOs)
}

const onMaxChange = (lfo: LFO, $ev: Event) => {
  lfo.max = Number(($ev.target as HTMLInputElement).value)
  triggerRef(sequencer.LFOs)
}

const onBtnDeleteClick = (lfo: LFO) => {
  if (!prompt('Are you sure?')) {
    return
  }

  sequencer.removeLFO(lfo)
  triggerRef(sequencer.LFOs)
}
</script>


<style lang="scss" scoped>
@import '@/assets/variables.scss';

.lfo-jobs-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  align-content: stretch;
  background-color: $color-grey-800;
  padding: 0 1rem 0 0.5rem;

  border-radius: 3px;
}

.lfo {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  align-content: stretch;
  background-color: $color-grey-800;
  padding: 0 1rem 0 0.5rem;

  border-radius: 3px;

  &__param {
    font-size: 0.75rem;
    color: $color-grey-400;
    flex: 1;
  }
}

.lfos {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: stretch;
  align-content: stretch;
  gap: 0.5rem;
}

.lfo__actions {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: stretch;
  align-content: stretch;
  gap: 0.5rem;

  & > button {
    flex: 1;
  }
}


</style>
