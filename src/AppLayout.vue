<script lang="ts" setup>
import SequencerApp from './components/SequencerApp.vue'
import {NIcon, useDialog} from 'naive-ui'
import TrackJobs from "@/components/AvailableSides/TrackJobs.vue";
import {
  DownloadOutline as DownloadIcon,
  FolderOpen as FolderIcon,
  InformationCircleOutline as InfoIcon,
  OptionsOutline as OptionsIcon,
  SaveOutline as SaveIcon
} from '@vicons/ionicons5'
import SimpleButton from "@/components/ui/SimpleButton.vue";
import {Sequencer} from "~/lib/Sequencer";
import SettingsDrawer from "@/components/ui/SettingsDrawer.vue";
import {h, onMounted, ref, resolveComponent} from "vue";
import {VERSION} from "@/constants";
import * as Tone from "tone/Tone";

const dialog = useDialog()

onMounted(() => {
  showInfo()
})

const sequencer = Sequencer.getInstance(16) // the creation is supposed to be done only once - here

const isSettingsOpen = ref(false);

const onShowOptions = () => {
  isSettingsOpen.value = true
}

const showInfo = (() => {
  dialog.info({
    title: `fuquencer v${VERSION}`,
    content: () => h(resolveComponent('InfoPage')),
    closeOnEsc: false,
    onClose: async () => {
      await Tone.start()
    }
  })
})

</script>

<template>
  <div class="grid" style="margin-bottom: 0.5rem">
    <div></div>
    <header>
      <div class="flex">
        <h1 class="title">fuquencer</h1>
        <menu>
          <SimpleButton class="big">
            <NIcon :component="SaveIcon"></NIcon>
            Save
          </SimpleButton>
          <SimpleButton class="big">
            <NIcon :component="FolderIcon"></NIcon>
            Load
          </SimpleButton>
          <SimpleButton class="big">
            <NIcon :component="DownloadIcon"></NIcon>
            Export
          </SimpleButton>
          <SimpleButton class="big" @click="onShowOptions">
            <NIcon :component="OptionsIcon"></NIcon>
            Options
          </SimpleButton>
          <SimpleButton class="big" @click="showInfo">
            <NIcon :component="InfoIcon"></NIcon>
            Info
          </SimpleButton>
        </menu>
      </div>
    </header>
    <div></div>
  </div>

  <div class="grid">
    <aside>
      <TrackJobs :key="sequencer.isPlaying.toString()"></TrackJobs>
    </aside>

    <main>
      <SequencerApp/>
    </main>

    <aside>
    </aside>
  </div>

  <SettingsDrawer :is-settings-open="isSettingsOpen" @update:is-settings-open="isSettingsOpen = $event"/>
</template>

<style lang="scss" scoped>
@import '@/assets/variables.scss';

.grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  overflow: hidden;
  justify-content: space-evenly;
  flex-wrap: nowrap;
  gap: 1rem;
}

.title {
  font-size: 2rem;
  display: inline;
}

menu {
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
  align-items: center
}

@media (max-width: 1600px) {
  .grid {
    grid-template-columns: 1fr;
  }

  main {
    grid-row: 1;
  }

  aside {
    grid-row: 2;
  }
}
</style>
