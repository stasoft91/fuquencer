<template>
  <div class="wrapper">
    <div class="patterns-list">
      <div
          class="patterns-chain-composer cloud"
      >
        <SimpleButton
            v-for="pattern in availablePatterns"
            :key="pattern.id"
            :data-id="pattern.id"
            :value="sequencer.selectedPatternId.value === pattern.id"
            class="draggable handle"
            draggable="true"
            style="--indicator-false-color: grey; --indicator-false-color-shadow: darkgrey;"
            @click="onSelectPattern(pattern.id)"
            @dragstart="onDragStart"
        >{{ pattern.name }}
        </SimpleButton>
      </div>

      <div
          class="patterns-chain-composer"
          @dragover="(e: Event) => e.preventDefault()"
          @drop="onChange"
      >
        <SimpleButton
            v-for="patternId in patternChain"
            :key="patternId"
            :data-id="patternId"
            class="draggable handle in-chain"
            draggable="true"
            @dragstart="onDragStart"
        >{{ availablePatterns.find(pattern => pattern.id === patternId)?.name ?? patternId }}
        </SimpleButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {computed} from "vue";
import {Sequencer} from "~/lib/Sequencer";
import SimpleButton from "@/components/ui/SimpleButton.vue";

const sequencer = Sequencer.getInstance()

const availablePatterns = computed(() => [...sequencer.patternMemory.patterns])

const patternChain = computed(() => {
  return sequencer.patternChain.value
})

const emit = defineEmits<{
  (event: 'update:chain', payload: string[]): void
}>()

const onSelectPattern = (patternId?: string) => {
  console.log('onSelectPattern', patternId)
  sequencer.selectPatternById(patternId ?? '')
}
const onChange = (evt: DragEvent) => {
  evt.preventDefault();

  const newChain: string[] = [];

  for (let element of document.getElementsByClassName('in-chain')) {
    const id = (element as HTMLElement).dataset.id
    id && newChain.push(id)
  }

  const {id, isFromChain} = JSON.parse(evt.dataTransfer!.getData('text/plain')) as unknown as { id: string, isFromChain: boolean }
  if (isFromChain) {
    return
  }

  sequencer.patternChain.value = [...newChain, id]

  console.log('newChain', sequencer.patternChain.value)
}

const onDragStart = (evt: DragEvent) => {
  const id = (evt.target as HTMLElement).dataset.id!
  const className = (evt.target as HTMLElement).className
  const isFromChain = className.includes('in-chain')

  evt.dataTransfer!.setData('text/plain', JSON.stringify({id, isFromChain}))
  evt.dataTransfer!.dropEffect = 'move'
}
</script>

<style lang="scss" scoped>
@import '@/assets/variables.scss';

.wrapper {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: start;
}

.patterns-list {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  justify-content: start;
  gap: 1rem;
}

.patterns-chain-composer {
  display: flex;
  flex-direction: row;
  justify-content: start;
  align-content: center;

  gap: 1rem;

  background-color: $color-grey-800;
  padding: 0.25rem;

  flex: 1 0 0;
  position: relative;
  flex-wrap: wrap;
}

.patterns-chain-composer.cloud {
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

.selected-pattern {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 1rem;
}
</style>
