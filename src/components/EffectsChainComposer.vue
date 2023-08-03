<template>
  <div class="wrapper">
    <Sortable
      tag="div"
      :item-key="(item: any) => item.name + item.id"
      class="effects-chain-composer cloud"
      :list="availableEffects"
      :options="effectsLibraryDraggableOptions"
      @click="onClick(null)"
    >
      <template #item="{element, index}: {element: UniversalEffect, index: number}">
        <div
          :data-id="element.name"
          class="draggable"
          :key="element.name"
          @click.stop="onClick(index)"
          :class="{active: index === selectedEffectIndex}"
        >
          <div class="handle">{{ element.name  || `Track ${index}` }}</div>
        </div>
      </template>
    </Sortable>

    <Sortable
      ref="chainEffectsContainer"
      tag="div"
      item-key="name"
      class="effects-chain-composer"
      :list="effectsChain"
      :options="effectsChainDraggableOptions"
      @end="onChange"
      @add="onChange"
      @click="onClick(null)"
    >
      <template #item="{element, index}: {element: UniversalEffect, index: number}">
        <div
          :data-id="element.name"
          class="draggable"
          :key="element.name"
          @click.stop="onClick(index)"
          :class="{active: index === selectedEffectIndex}"
        >
          <div class="handle">{{ element.name }}</div>
        </div>
      </template>
    </Sortable>
  </div>
</template>

<script lang="ts" setup>
// @ts-ignore - this is a bug in the types (sortablejs-vue3 is not typed well)
import {Sortable} from "sortablejs-vue3";
import type {UniversalEffect} from "~/lib/Effects.types";
import {ref} from "vue";
import {AVAILABLE_EFFECTS} from "@/constants";
import SortableJS from "sortablejs";

let availableEffects: UniversalEffect[] = AVAILABLE_EFFECTS
    .sort((a, b) => a.name.localeCompare(b.name))
    .filter(_ => _.name !== 'AutoDuck')

const chainEffectsContainer = ref<{ sortable: SortableJS }>()

const props = defineProps<{
  effectsChain: UniversalEffect[],
}>()

const emit = defineEmits<{
  (event: 'update:chain', payload: string[]): void
}>()

const selectedEffectIndex = ref<number | null>(null)

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

const onClick = (effectIndex: number | null) => {
  selectedEffectIndex.value = effectIndex
}

const onChange = () => {
  const newChain = chainEffectsContainer.value!.sortable.toArray()
  emit('update:chain', newChain)
}
</script>

<style scoped lang="scss">
@import '@/assets/variables.scss';

.wrapper {
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
</style>
