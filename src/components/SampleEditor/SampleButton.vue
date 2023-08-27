<template>
  <button :style="{'--bg-color': bgcolor ?? 'hsl(51, 60%, 69%)', width}" class="ghost-button" @click="onClick">
    <DisplayWaveform
        id="sample-editor-button"
        :height="64"
        :normalize="false"
        :sample-name="track.name"
        :url="props.sampleUrl ?? track.meta.get('urls')[DEFAULT_NOTE] ?? ''"
        :wave-color="color"
        class="waveform"
    />
    <span class="hover-text">
      <span class="text">
        <slot></slot>
      </span>
    </span>
    <input ref="file" style="display:none" type="file"/>
  </button>
</template>

<script lang="ts" setup>
import DisplayWaveform from "@/components/DisplayWaveform/DisplayWaveform.vue";
import type {Track} from "~/lib/Track";
import {ref} from "vue";
import {DEFAULT_NOTE} from "~/lib/Sequencer";
import {SoundEngine} from "~/lib/SoundEngine";

const props = defineProps<{
  track: Track
  color: string,
  bgcolor?: string,
  width?: string,
  sampleUrl?: string
}>()

const emit = defineEmits<{
  (event: 'click', payload: MouseEvent): void
}>()

const onClick = async (event: MouseEvent) => {
  getFile()
  // emit('click', event)
}

const file = ref<HTMLInputElement | null>(null)

function getFile() {
  if (file.value === null) {
    return
  }

  file.value.onchange = () => {
    if (file.value?.files !== null && file.value?.files.length && file.value?.files.length > 0) {
      const url = URL.createObjectURL(file.value.files[0])

      SoundEngine.createSampler(url, '').then((sampler) => {
        props.track.source.dispose();
        // eslint-disable-next-line vue/no-mutating-props
        props.track.source = sampler;

        props.track.meta.set('urls', {[DEFAULT_NOTE]: url})
      }).catch((e) => {
        console.error(e)
      })
    }
  };

  file.value.click();
}
</script>

<style lang="scss" scoped>
.waveform {
  position: relative;
  -webkit-transition: -webkit-filter 0.2s ease-in-out;
  -moz-transition: 0.2s -moz-filter ease-in-out;
  -ms-transition: 0.2s -ms-filter ease-in-out;
  -o-transition: 0.2s -o-filter ease-in-out;
  transition: 0.2s filter ease-in-out, 0.2s -webkit-filter ease-in-out;

  background-color: hsl(51, 60%, 69%);
  filter: hue-rotate(0deg) brightness(1) saturate(1);
  flex: 1 1 100%;
}

.hover-text {
  opacity: 0;
  position: absolute;
  top: 0.25rem;
  bottom: 0.25rem;
  left: 0.25rem;
  right: 0.25rem;
  font-size: 3rem;
  transition: 0.2s opacity ease-in-out;
  color: var(--color-grey-900);
  text-shadow: -1px -1px 0 var(--color-grey-500),
  1px -1px 0 var(--color-grey-500),
  -1px 1px 0 var(--color-grey-500),
  1px 1px 0 var(--color-grey-500);
}

.ghost-button {
  background-color: var(--bg-color);
  width: 100%;
  cursor: pointer;
  outline: none;
  border: 1px solid var(--color-grey-600);
  border-radius: 3px;
  padding: 0.25rem;
  position: relative;

  &:hover .waveform {
    cursor: pointer;
    filter: hue-rotate(10deg) brightness(0.3) saturate(1.2);
  }

  &:hover .hover-text {
    opacity: 1;
  }
}
</style>
