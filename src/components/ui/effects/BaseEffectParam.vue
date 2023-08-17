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
        class="constrained-width"
        @update:model-value="onUpdate(controlToRawValue($event))"
        @click:link="onLinkClick"
    />
    <n-card v-else :size="'small'" :title="fieldName">
      <n-select v-model:value="currentValue" :options="selectOptions" class="constrained-width" size="large"
                @update:value="onUpdate($event)"/>
    </n-card>
    <!--    <select v-else :value="currentValue" class="constrained-width" @change="onUpdate($event.target!.value)"> // TODO SELECTOR WITH CAPTION-->
    <!--      <option v-for="option in selectOptions" :key="effectName+'.'+option" :value="option">{{ option }}</option>-->
    <!--    </select>-->
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
import {onMounted, ref} from "vue";
import type {UniversalEffect} from "~/lib/Effects.types";
import {EFFECTS_OPTIONS} from "@/constants";
import type {SelectMixedOption} from "naive-ui/es/select/src/interface";
import * as Tone from "tone/Tone";
import {DEFAULT_NOTE, Sequencer} from "~/lib/Sequencer";
import {getToneTimeNextMeasure} from "~/lib/utils/getToneTimeNextMeasure";

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

let controlToRawValue = (value: number) => value
let rawValueToControl = (value: number) => value

const onUpdate = (value: string | number) => {
  currentValue.value = value
  const soundEngine = SoundEngine.getInstance()

  for (const track in soundEngine.tracks) {
    const editedEffect = soundEngine.tracks[track].middlewares.find(__ => __.name === props.effectName)

    if (!editedEffect || !editedEffect.options || !editedEffect.effect) continue;

    // @ts-ignore
    if (editedEffect.options[props.fieldName] === undefined) {
      console.warn(`Field ${props.fieldName} not found in effect ${props.effectName}`)
      continue;
    }

    // @ts-ignore
    editedEffect.options[props.fieldName] = value

    editedEffect.effect.set({
      [props.fieldName]: value
    })

    emit(`update:value`, editedEffect as UniversalEffect)
    return;
  }
}

onMounted(() => {
  const soundEngine = SoundEngine.getInstance()

  const track = soundEngine.tracks
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

const onLinkClick = () => {
  const sequencer = Sequencer.getInstance()
  const soundEngine = sequencer.soundEngine

  const track = soundEngine.tracks
      .find(_ => _.name === props.trackName)!

  const middlewares = track.middlewares
      .find(__ => __.name === props.effectName)!

  const effect = middlewares.effect

  if (!effect) {
    return;
  }

  // !isNaN === is number
  // isNaN === is not number === e.g. object
  if (!isNaN(effect[props.fieldName])) {

    //effect[props.fieldName]
    track.addLoop({
      isAutomation: true,
      callback: (_time: number) => {
        effect.set({[props.fieldName]: 0});
        const measure = Tone.Time(_time).toBarsBeatsSixteenths().split(':').map(_ => parseInt(_))
        console.log(measure)
        //
        // if (getStepFromBarsBeatsSixteens(Tone.Time(_time).toBarsBeatsSixteenths()) === 1) {
        //   effect.set({[props.fieldName]: 0});
        // }
        //
        // let unsafeValue = effect[props.fieldName] + 1/32
        // console.log(getStepFromBarsBeatsSixteens(Tone.Time(_time).toBarsBeatsSixteenths()), unsafeValue)
        // if (unsafeValue > 1) {
        //   unsafeValue = 1
        // }
        // effect[props.fieldName] = unsafeValue
      },
      note: DEFAULT_NOTE,
      interval: '16n',
    }).start(getToneTimeNextMeasure()).stop(getToneTimeNextMeasure(2))
  } else {
    effect.set({[props.fieldName]: 0});
    effect[props.fieldName].linearRampTo(1, Tone.Time('1m').toSeconds() * 2, getToneTimeNextMeasure())
  }
}
</script>
