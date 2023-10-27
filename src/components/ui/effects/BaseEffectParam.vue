<template>
  <div class="wrapper">
    <RichFaderInput
        v-if="selectOptions.length === 0"
        :default-value="rawValueToControl(currentValue as number)"
        :label="fieldName"
        :max="max"
        :min="min"
        :model-value="rawValueToControl(currentValue as number)"
        :step="step"
        :is-link-disabled="!isAutomatable"
        class="constrained-width"
        @update:model-value="onUpdate(controlToRawValue($event))"
        @click:link="onLinkClick"
    />

    <n-card v-else :size="'small'" :title="fieldName">
      <n-select v-model:value="currentValue" :options="selectOptions" class="constrained-width" size="large"
                @update:value="onUpdate($event)"/>
    </n-card>
  </div>
</template>

<style lang="scss" scoped>
@import '@/assets/variables.scss';
</style>

<script lang="ts" setup>
import {NCard, NSelect} from 'naive-ui'

import RichFaderInput from "@/components/ui/RichFaderInput.vue";
import {SoundEngine} from "~/lib/SoundEngine";
import type {Ref} from "vue";
import {computed, onMounted, ref} from "vue";
import type {UniversalEffect} from "~/lib/Effects.types";
import {EFFECTS_OPTIONS} from "@/constants";
import type {SelectMixedOption} from "naive-ui/es/select/src/interface";
import * as Tone from "tone/Tone";
import {Sequencer} from "~/lib/Sequencer";

const emit = defineEmits<{
  (event: `update:value`, payload: UniversalEffect): void
}>()

export type BaseEffectProps = {
  trackName: string,
  fieldName: string,
  effectName: string,
}

const props = defineProps<BaseEffectProps>()

const currentValue: Ref<string | number> = ref(0)
const min: Ref<number> = ref(0)
const max: Ref<number> = ref(100)
const step: Ref<number> = ref(0.1)
const selectOptions = ref<SelectMixedOption[]>([])
const sequencer = Sequencer.getInstance()
const soundEngine = sequencer.soundEngine

let controlToRawValue = (value: number) => value
let rawValueToControl = (value: number) => value

const onUpdate = (value: string | number) => {
  currentValue.value = value
  const soundEngine = SoundEngine.getInstance()

  const track = soundEngine.tracks.value.find(_ => _.name === props.trackName)

  if (!track) return;

  const editedEffect = track.middlewares.find(__ => __.name === props.effectName)

  if (!editedEffect || !editedEffect.options || !editedEffect.effect) return;

  // @ts-ignore
  if (editedEffect.options[props.fieldName] === undefined) {
    console.warn(`Field ${props.fieldName} not found in effect ${props.effectName}`)
    return;
  }

  // @ts-ignore
  editedEffect.options[props.fieldName] = value

  if (editedEffect.name === 'AutoDuck') {
    soundEngine.sidechainEnvelopeSource?.set({
      [props.fieldName]: value
    })
  } else {
    editedEffect.effect.set({
      [props.fieldName]: value
    })
  }

  emit(`update:value`, editedEffect as UniversalEffect)
}

onMounted(() => {
  const soundEngine = SoundEngine.getInstance()

  const track = soundEngine.tracks.value
      .find(_ => _.name === props.trackName)!

  const middlewares = track.middlewares
      .find(__ => __.name === props.effectName)!

  currentValue.value = middlewares.options![props.fieldName] ?? 0;

  const fieldMeta = EFFECTS_OPTIONS[props.effectName].find(_ => _.name === props.fieldName)!

  fieldMeta.min && (min.value = fieldMeta.min)
  fieldMeta.max && (max.value = fieldMeta.max)
  fieldMeta.step && (step.value = fieldMeta.step)

  EFFECTS_OPTIONS[props.effectName].find(_ => _.name === props.fieldName)!.enum
      ?.forEach(_ => selectOptions.value.push({
        label: _,
        value: _
      }))

  if (fieldMeta.min === undefined || fieldMeta.max === undefined) {
    controlToRawValue = (value: number) => value / 100
    rawValueToControl = (value: number) => value * 100
  }

  if (fieldMeta.controlToRawValue) {
    controlToRawValue = fieldMeta.controlToRawValue
  }

  if (fieldMeta.rawValueToControl) {
    rawValueToControl = fieldMeta.rawValueToControl
  }
})

const isAutomatable = computed(() => {
  const track = soundEngine.tracks.value
      .find(_ => _.name === props.trackName)!

  const middlewares = track.middlewares
      .find(__ => __.name === props.effectName)!

  const effect = middlewares.effect

  return isNaN(effect[props.fieldName])
})

const onLinkClick = () => {
  const track = soundEngine.tracks.value
      .find(_ => _.name === props.trackName)!

  const middlewares = track.middlewares
      .find(__ => __.name === props.effectName)!

  const effect = middlewares.effect

  if (!effect) {
    return;
  }

  // we can`t do anything if it is a number
  // it should be an automatable param (object)
  if (typeof effect[props.fieldName] === 'number') {
    return
  }

  const prop = effect[props.fieldName] as Tone.Param

  sequencer.addLFO({
    frequency: Tone.Time('16n').toFrequency(),
    type: 'random',
    max: prop.maxValue,
    min: prop.minValue,
    title: `${track.name} / ${props.effectName} / ${props.fieldName}`,
    address: `${track.name}.middlewares.${props.effectName}.${props.fieldName}`,
  })
}
</script>
