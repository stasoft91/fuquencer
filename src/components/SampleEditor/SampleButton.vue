<template>
  <button :style="{'--bg-color': bgcolor ?? 'hsl(81, 60%, 69%)', width}" class="ghost-button" @click="onClick">
    <DisplayWaveform
        id="sample-editor-button"
        :height="64"
        :normalize="false"
        :sample-name="track.name"
        :url="sampleUrl ?? ''"
        :wave-color="color"
        class="waveform"
    />
    <slot></slot>
    <input ref="file" style="display:none" type="file"/>
  </button>
</template>

<script lang="ts" setup>
import type {Track} from "~/lib/Track";
import {ref, watch} from "vue";
import {DEFAULT_NOTE} from "~/lib/Sequencer";
import DisplayWaveform from "@/components/DisplayWaveform/DisplayWaveform.vue";
import {SOURCE_TYPES} from "~/lib/SoundEngine";

const file = ref<HTMLInputElement | null>(null)

const props = defineProps<{
  track: Track
  color: string,
  bgcolor?: string,
  width?: string,
}>()

const onClick = async () => {
  URL.revokeObjectURL(sampleUrl.value)
  getFile()
}


const sampleUrl = ref('')

watch(props.track.isSourceInitialized, () => {
  if (props.track.isSourceInitialized.value && props.track.meta.has('urls')) {
    sampleUrl.value = props.track.meta.get('urls')[DEFAULT_NOTE] ?? ''
  }
})

const getFile = () => {
  if (file.value === null) {
    return
  }

  file.value.onchange = async () => {
    const clonedFile = file.value?.files?.item(0)

    if (!clonedFile) {
      return
    }

    const url = URL.createObjectURL(clonedFile)
    sampleUrl.value = url
    props.track.meta.set('urls', {[DEFAULT_NOTE]: url})
    await props.track.setTrackType(SOURCE_TYPES.sampler, url)
  }


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

  background-color: hsl(81, 60%, 69%);
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
  transition: 0.2s all ease-in-out;
  color: var(--color-grey-300);
  text-shadow: -1px -1px 0 var(--color-grey-800),
  1px -1px 0 var(--color-grey-800),
  -1px 1px 0 var(--color-grey-800),
  1px 1px 0 var(--color-grey-800);
}

.ghost-button {
  background-color: var(--bg-color);
  width: 100%;
  cursor: pointer;
  outline: none;
  border: 1px solid var(--color-grey-600);
  padding: 0.25rem;
  position: relative;

  &:hover {
    cursor: pointer;
    filter: hue-rotate(-10deg) brightness(1.1) saturate(1.1);
  }

  &:hover .hover-text {
    opacity: 1;
  }
}
</style>
