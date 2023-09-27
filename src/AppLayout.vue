<script lang="ts" setup>
import SequencerApp from './components/SequencerApp.vue'
import {NIcon, useDialog} from 'naive-ui'
import TrackJobs from "@/components/AvailableSides/TrackJobs.vue";
import LFOJobs from "@/components/AvailableSides/LFOJobs.vue";
import {
  ArrowRedoOutline as RedoIcon,
  ArrowUndoOutline as UndoIcon,
  FolderOpen as FolderIcon,
  InformationCircleOutline as InfoIcon,
  MusicalNoteOutline as NotesIcon,
  OptionsOutline as OptionsIcon,
  SaveOutline as SaveIcon
} from '@vicons/ionicons5'
import SimpleButton from "@/components/ui/SimpleButton.vue";
import {Sequencer} from "~/lib/Sequencer";
import SettingsDrawer from "@/components/ui/SettingsDrawer.vue";
import {computed, h, onMounted, ref, resolveComponent} from "vue";
import {VERSION} from "@/constants";
import * as Tone from "tone/Tone";
import {useGridEditorStore} from "@/stores/gridEditor";

import StepJobs from "@/components/AvailableSides/StepJobs.vue";
import {GridCell} from "~/lib/GridCell";

const dialog = useDialog()

onMounted(() => {
  showInfo()
})

const gridStore = useGridEditorStore()

const sequencer = Sequencer.getInstance() // the creation is supposed to be done only once - here

const isSettingsOpen = ref(false);

const onShowOptions = () => {
  isSettingsOpen.value = true
}

const showInfo = (() => {
  dialog.info({
    title: `fuquencer v${VERSION}`,
    content: () => h(resolveComponent('InfoPage')),
    closeOnEsc: false,
    async onClose() {
      await Tone.start()
    },
    async onAfterLeave() {
      // TODO: this is a hack to make sure the instruments are loaded before playing, should be done better
      if (sequencer.soundEngine.tracks.value.length === 0) {
        await sequencer.initTracksDemoLegacy()
      }
    },
  })
})

const hasCellInEdit = computed(() => {
  return gridStore.selectedGridCell !== null
})

const selectedCell = computed(() => {
  return gridStore.selectedGridCell as GridCell | null
})

const canUndo = computed(() => {
  return sequencer.history.canUndo
})

const canRedo = computed(() => {
  return sequencer.history.canRedo
})

const onUndo = () => {
  const cell = sequencer.history.undo()
  cell && sequencer.writeCell(cell, true)
}

const onRedo = () => {
  const cell = sequencer.history.redo()
  cell && sequencer.writeCell(cell, true)
}

const handleExport = () => {
  const exportData = sequencer.export();

  // save file dialog
  const blob = new Blob([(exportData)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fuquencer.json';
  a.click();
  URL.revokeObjectURL(url)
  a.remove()
}

const handleImport = async () => {
  let importData = ''

  // read json from open file dialog
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  input.onchange = (event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = async (event) => {
      importData = event.target?.result as string;
      await Sequencer.importFrom(importData);
      input.remove();
    };
    reader.readAsText(file);
  };

  input.click();
}

const handleDemo = async () => {
  await fetch('./demo_1.json').then(res => res.text()).then(importData => Sequencer.importFrom(importData))
}

</script>

<template>
  <header>
    <div class="flex">
      <h1 class="title">fuquencer</h1>
      <menu>
        <SimpleButton class="big" @click="handleExport">
          <NIcon :component="SaveIcon"></NIcon>
          Save
        </SimpleButton>
        <SimpleButton class="big" @click="handleImport">
          <NIcon :component="FolderIcon"></NIcon>
          Load
        </SimpleButton>
        <SimpleButton class="big" @click="handleDemo">
          <NIcon :component="NotesIcon"></NIcon>
          Demo #1
        </SimpleButton>
        <!--        <SimpleButton class="big">-->
        <!--          <NIcon :component="DownloadIcon"></NIcon>-->
        <!--          Export-->
        <!--        </SimpleButton>-->
        <SimpleButton class="big" @click="onShowOptions">
          <NIcon :component="OptionsIcon"></NIcon>
          Options
        </SimpleButton>
        <SimpleButton class="big" @click="showInfo">
          <NIcon :component="InfoIcon"></NIcon>
          Info
        </SimpleButton>
        <SimpleButton :disabled="!canUndo" class="big" @click="onUndo">
          <NIcon :component="UndoIcon"></NIcon>
          Undo
        </SimpleButton>
        <SimpleButton :disabled="!canRedo" class="big" @click="onRedo">
          <NIcon :component="RedoIcon"></NIcon>
          Redo
        </SimpleButton>
      </menu>
    </div>
  </header>

  <div class="grid">
    <aside>
      <TrackJobs v-if="!hasCellInEdit" :key="selectedCell?.id"></TrackJobs>
      <StepJobs v-if="selectedCell !== null && hasCellInEdit"
                :key="selectedCell.id"
                :cell="selectedCell"
      ></StepJobs>
    </aside>

    <main>
      <SequencerApp/>
    </main>

    <aside>
      <LFOJobs v-if="sequencer.LFOs.value.length" :key="sequencer.LFOs.value.length"></LFOJobs>
    </aside>
  </div>

  <SettingsDrawer :is-settings-open="isSettingsOpen" @update:is-settings-open="isSettingsOpen = $event"/>
</template>

<style lang="scss" scoped>
@import '@/assets/variables.scss';

.grid {
  display: grid;
  grid-template-columns: 1fr 4fr 1fr;
  overflow: hidden;
  justify-content: space-evenly;
  flex-wrap: nowrap;
  row-gap: 1rem;
  column-gap: 1rem;
}

.title {
  font-size: 2rem;
  display: inline;
}

menu {
  overflow: auto;
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 1rem;

  & i {
    font-size: 1rem;
  }
}

.big {
  height: 3rem;
}

.flex {
  display: flex;
  flex-direction: row;

  height: 4rem;
  align-items: center;
  justify-content: center;
}


@media (max-width: 1600px) {
  .grid {
    grid-template-columns: 4fr 1fr;
    column-gap: 0;
  }

  main {
    grid-column: 1;
    grid-row: 1;
  }

  aside {
    grid-row: 2;
    grid-column: 1;
  }

  aside:first-of-type {
    grid-row: 1;
    grid-column: 2;
  }
}

@media (max-width: 1080px) {
  .grid {
    display: flex;
    flex-direction: column;
  }

  main {
    order: 1;
  }

  aside {
    order: 3;
  }

  aside:first-of-type {
    order: 2;
  }
}

button.active {
  box-shadow: inset $color-orange-opaque 0 0 0 3px;
}
</style>
