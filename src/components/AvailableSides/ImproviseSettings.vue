<template>
  <NCard :on-close="() => emits('update:is-open', false)"
         closable
         size="medium"
         title="Improvise settings"
  >
    <div class="column">

      <label for="improvise-options">Notes
        <chord-editor :key="gridStore.improviseOptions.notesInKey.join(',')"
                      :is-drum="false"
                      :track="selectedTrack"
                      :value="gridStore.improviseOptions.notesInKey"
                      @update:value="(notes) => gridStore.improviseOptions.notesInKey = notes"></chord-editor>
        <button
            v-if="gridStore.improviseOptions.notesInKey.toString() !== IMPROVISATOR_DEFAULTS.notesInKey.toString()"
            @click="gridStore.improviseOptions.notesInKey = IMPROVISATOR_DEFAULTS.notesInKey"
        >reset
        </button>
      </label>


      <label for="improvise-options">Activate each N-th step
        <input v-model="gridStore.improviseOptions.columnMutationMod" class="full-size big"
               max="16"
               min="0"
               placeholder="3"
               step="1" type="number"/>
        <button
            v-if="gridStore.improviseOptions.columnMutationMod !== IMPROVISATOR_DEFAULTS.columnMutationMod"
            @click="gridStore.improviseOptions.columnMutationMod = IMPROVISATOR_DEFAULTS.columnMutationMod"
        >reset
        </button>
      </label>

      <label for="improvise-options">N-th step activation probability (0-1)
        <input v-model="gridStore.improviseOptions.columnMutationProbability" class="full-size big"
               max="100"
               min="0"
               placeholder="75"
               step="0.01" type="number"/>
        <button
            v-if="gridStore.improviseOptions.columnMutationProbability !== IMPROVISATOR_DEFAULTS.columnMutationProbability"
            @click="gridStore.improviseOptions.columnMutationProbability = IMPROVISATOR_DEFAULTS.columnMutationProbability"
        >reset
        </button>
      </label>

      <label for="improvise-options">Step mute probability (0-1)
        <input v-model="gridStore.improviseOptions.columnMuteProbability" class="full-size big"
               max="100"
               min="0"
               step="0.01"
               type="number"/>
        <button
            v-if="gridStore.improviseOptions.columnMuteProbability !== IMPROVISATOR_DEFAULTS.columnMuteProbability"
            @click="gridStore.improviseOptions.columnMuteProbability = IMPROVISATOR_DEFAULTS.columnMuteProbability"
        >reset
        </button>
      </label>

      <label for="improvise-options">Flam probability (0-1)
        <input v-model="gridStore.improviseOptions.flamModeProbability" class="full-size big"
               max="1"
               min="0"
               step="0.01"
               type="number"/>
        <button
            v-if="gridStore.improviseOptions.flamModeProbability !== IMPROVISATOR_DEFAULTS.flamModeProbability"
            @click="gridStore.improviseOptions.flamModeProbability = IMPROVISATOR_DEFAULTS.flamModeProbability"
        >reset
        </button>
      </label>

      <label for="improvise-options">Skip probability (0-1)
        <input v-model="gridStore.improviseOptions.skipModProbability" class="full-size big"
               max="100"
               min="0"
               step="0.01"
               type="number"/>
        <button
            v-if="gridStore.improviseOptions.skipModProbability !== IMPROVISATOR_DEFAULTS.skipModProbability"
            @click="gridStore.improviseOptions.skipModProbability = IMPROVISATOR_DEFAULTS.skipModProbability"
        >reset
        </button>
      </label>

      <label for="improvise-options">Slide probability (0-1)
        <input v-model="gridStore.improviseOptions.slideModProbability" class="full-size big"
               max="100"
               min="0"
               step="0.01"
               type="number"/>
        <button
            v-if="gridStore.improviseOptions.slideModProbability !== IMPROVISATOR_DEFAULTS.slideModProbability"
            @click="gridStore.improviseOptions.slideModProbability = IMPROVISATOR_DEFAULTS.slideModProbability"
        >reset
        </button>
      </label>

      <label for="improvise-options">Rnd probability (0-1)
        <input v-model="gridStore.improviseOptions.probabilityModProbability" class="full-size big"
               max="100"
               min="0"
               step="0.01"
               type="number"/>
        <button
            v-if="gridStore.improviseOptions.probabilityModProbability !== IMPROVISATOR_DEFAULTS.probabilityModProbability"
            @click="gridStore.improviseOptions.probabilityModProbability = IMPROVISATOR_DEFAULTS.probabilityModProbability"
        >reset
        </button>
      </label>

      <SimpleButton
          class="full-size big"
          @click="onImprovise"
      >
        <NIcon :component="Dice" size="24px"></NIcon>
        Improvise
      </SimpleButton>
    </div>
  </NCard>
</template>
<script lang="ts" setup>
import ChordEditor from "@/components/ui/ChordEditor.vue";
import {NCard, NIcon} from "naive-ui";
import {useGridEditorStore} from "@/stores/gridEditor";
import {computed} from "vue";
import {useSelectedTrackNumber} from "@/stores/trackParameters";
import {Sequencer} from "~/lib/Sequencer";
import SimpleButton from "@/components/ui/SimpleButton.vue";
import {DiceSharp as Dice} from "@vicons/ionicons5";
import {IMPROVISATOR_DEFAULTS} from "@/constants";

const gridStore = useGridEditorStore()
const selectedTrackNumberStore = useSelectedTrackNumber()

const sequencer = Sequencer.getInstance()

const selectedTrack = computed(() => {
  return sequencer.soundEngine.tracks.value[selectedTrackNumberStore.selectedTrackIndex]
})

const emits = defineEmits(['update:is-open'])

const onImprovise = () => {
  const selectedTrack = sequencer.soundEngine.tracks.value[selectedTrackNumberStore.selectedTrackIndex]

  const trackIndex = sequencer.soundEngine.tracks.value.findIndex(track => track.name === selectedTrack.name) + 1
  sequencer.regenerateSequence(trackIndex)
}
</script>

<style lang="scss" scoped>
.column {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.big {
  height: 3rem;
}

.full-size {
  width: 100%;
}
</style>
