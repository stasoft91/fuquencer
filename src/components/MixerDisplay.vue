<template>
  <div class="mixer">
    <div v-for="track in sequencer.soundEngine.tracks.value" :key="track.name" class="channel">
      <div class="channel-label">
        {{ track.name }}
      </div>
      <div class="controls">
        <SimpleButton
            v-if="!track.meta.get('mute')"
            :class="{dark: track.meta.get('mute')}"
            :value="!track.meta.get('mute')"
            class="big"
            icon="/icons/sound-on.svg"
            @click="toggleMute(track)">Playing
        </SimpleButton>
        <SimpleButton
            v-if="track.meta.get('mute')"
            :class="{dark: track.meta.get('mute')}"
            :value="!track.meta.get('mute')"
            class="big"
            icon="/icons/sound-mute.svg"
            @click="toggleMute(track)">Muted
        </SimpleButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.mixer {
  background-color: var(--color-grey-900);
  border-radius: 3px;
  padding: 1rem;
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}

.channel {
  display: flex;
  align-items: center;
  flex-direction: column;
  gap: 10px;
}

.channel-label {
  flex: 1;
}

.slider {
  flex: 2;
}

.controls {
  display: flex;
  gap: 10px;
  flex-direction: column;
}

.dark {
  background-color: var(--color-grey-700);
}

.dark:hover {
  background-color: var(--color-grey-600);
}

.big {
  height: 3rem;
  width: 6rem;
}
</style>

<script lang="ts" setup>
import SimpleButton from "@/components/ui/SimpleButton.vue";
import {Sequencer} from "~/lib/Sequencer";
import type {Track} from "~/lib/Track";
import * as Tone from 'tone/Tone'
import {getToneTimeNextMeasure} from "~/lib/utils/getToneTimeNextMeasure";

const sequencer = Sequencer.getInstance()

const toggleMute = (track: Track) => {
  const newValue = !track.meta.get('mute');

  const startTimeRaw = getToneTimeNextMeasure()

  Tone.Transport.scheduleOnce((time) => {
    track.channel.volume.cancelScheduledValues(time - 0.001)
    track.channel.volume.setValueAtTime(newValue ? -Infinity : 0, time)
    track.meta.set('mute', newValue)
  }, startTimeRaw)

}
</script>
