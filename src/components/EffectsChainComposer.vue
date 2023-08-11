<template>
  <div class="wrapper">
    <div class="effects-list">
      <Sortable
          :item-key="(item: any) => item.name + item.id"
          :list="availableEffects"
          :options="effectsLibraryDraggableOptions"
          class="effects-chain-composer cloud"
          tag="div"
          @click="onClick(null, false)"
      >
        <template #item="{element, index}: {element: UniversalEffect, index: number}">
          <div
              :key="element.name"
              :class="getClasses(element, false)"
              :data-id="element.name"
              class="draggable"
          >
            <div class="handle">{{ element.name || `Track ${index}` }}</div>
          </div>
        </template>
      </Sortable>

      <Sortable
          ref="chainEffectsContainer"
          :list="effectsChain"
          :options="effectsChainDraggableOptions"
          class="effects-chain-composer"
          item-key="name"
          tag="div"
          @add="onChange"
          @click="onClick(null, true)"
          @end="onChange"
      >
        <template #item="{element}: {element: UniversalEffect}">
          <div
              :key="element.name"
              :class="getClasses(element, true)"
              :data-id="element.name"
              class="draggable"
              @click.stop="onClick(element.name, true)"
          >
            <div class="handle">{{ element.name }}</div>
          </div>
        </template>
      </Sortable>
    </div>
    <div v-if="selectedEffectName"
         class="selected-effect"
    >
      <BaseEffectParam
          v-for="field in EFFECTS_OPTIONS[selectedEffectName]"
          :key="selectedEffectName + '.'+field.name"
          :effect-name="selectedEffectName"
          :field-name="field.name"
          :track-name="selectedTrackName"
      ></BaseEffectParam>
    </div>
  </div>
</template>

<script lang="ts" setup>
// @ts-ignore - this is a bug in the types (sortablejs-vue3 is not typed well)
import {Sortable} from "sortablejs-vue3";
import type {UniversalEffect} from "~/lib/Effects.types";
import {ref} from "vue";
import {AVAILABLE_EFFECTS, EFFECTS_OPTIONS} from "@/constants";
import SortableJS from "sortablejs";
import BaseEffectParam from "@/components/ui/effects/BaseEffectParam.vue";

let availableEffects: UniversalEffect[] = AVAILABLE_EFFECTS
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(_ => _.name !== 'AutoDuck')

const chainEffectsContainer = ref<{ sortable: SortableJS }>()

const props = defineProps<{
  effectsChain: UniversalEffect[],
  selectedTrackName: string
}>()

const emit = defineEmits<{
  (event: 'update:chain', payload: string[]): void
}>()

const selectedEffectName = ref<string | null>(null)
const isFocusOnActiveEffectsContainer = ref<boolean>(false)

const effectsChainDraggableOptions = {
    animation: 150,
    easing: "cubic-bezier(1, 0, 0, 1)",
    ghostClass: "ghost",
    swapThreshold: 0.5,
    dragClass: "drag",
    handle: ".handle",
    group: "effects-chain",
  } as SortableJS.Options

const effectsLibraryDraggableOptions: SortableJS.Options = {
  ... effectsChainDraggableOptions,
  sort: false,
  group: {
    name: "effects-chain",
    pull: "clone"
  }};

const fieldValueMiddlewareOnDisplay = (value: number) => {
  return value * 100
}

const fieldValueMiddlewareOnUpdate = (value: number) => {
  return value / 100
}

const onClick = (effectName: string | null, shouldSetFocusOnActiveEffectsContainer: boolean) => {
  isFocusOnActiveEffectsContainer.value = shouldSetFocusOnActiveEffectsContainer
  selectedEffectName.value = effectName
  isFocusOnActiveEffectsContainer.value = effectName !== null
}

const onChange = () => {
  const newChain = chainEffectsContainer.value!.sortable.toArray()
  emit('update:chain', newChain)
}

const getClasses = (element: UniversalEffect, isActiveEffectsContainer: boolean) => {
  return {
    active: isFocusOnActiveEffectsContainer.value === isActiveEffectsContainer && element.name === selectedEffectName.value,
    ignore: element.name === 'AutoDuck'
  }
}

const getFields = (effectName: string) => {
  const effect = availableEffects.find(_ => _.name === effectName)
  return effect ? effect.fields : []
}
</script>

<style scoped lang="scss">
@import '@/assets/variables.scss';

.wrapper {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: start;
}

.effects-list {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: start;
  gap: 1rem;
}

.effects-chain-composer {
  display: flex;
  flex-direction: row;
  justify-content: start;
  align-content: center;

  gap: 1rem;

  background-color: $color-grey-800;
  padding: 0.25rem;

  flex: 0 0 50%;
  position: relative;
  flex-wrap: wrap;
}

.effects-chain-composer.cloud {
  flex-wrap: wrap;
}

.draggable {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.draggable .handle {
  cursor: grab;
  padding: 0.75rem;
  background-color: $color-grey-700;
  overflow: hidden;
  color: $color-grey-100;
}

.draggable.drag {
  background-color: $color-grey-600;
  box-shadow: 0 0 4px 4px $color-grey-600;
}

.draggable.ghost {
  opacity: 0.5;
}

.draggable.active {
  background-color: $color-orange-opaque-lighter100;
  box-shadow: 0 0 2px 2px $color-orange-opaque-lighter100;
}

.selected-effect {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}

.draggable.ignore {
  opacity: 0.65;
}
</style>
