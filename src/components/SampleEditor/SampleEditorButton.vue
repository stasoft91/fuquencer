<template>
  <button class="ghost-button" @click="onClick">
    <DisplayWaveform id="sample-editor-button" :height="64" :normalize="false" :sample-name="track.name" :wave-color="color"
                     class="waveform"/>
    <span class="hover-text">
      <span class="text">CHANGE</span>
    </span>
  </button>

  <!--  <n-modal v-model:show="showModal" closable>-->
  <!--    AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA-->
  <!--  </n-modal>-->
</template>

<script lang="ts" setup>
import DisplayWaveform from "@/components/DisplayWaveform/DisplayWaveform.vue";
import type {Track} from "~/lib/Track";
import {DEFAULT_NOTE} from "~/lib/Sequencer";
import {SoundEngine} from "~/lib/SoundEngine";
import {ref} from "vue";

const props = defineProps<{
  track: Track
  color: string
}>()

const emit = defineEmits<{
  (event: 'click', payload: MouseEvent): void
}>()

const showModal = ref(true)

const onClick = async (event: MouseEvent) => {
  emit('click', event)

  const url = prompt('Enter a URL to a *.wav sample', props.track.meta.get('urls')[DEFAULT_NOTE])

  if (url) {
    SoundEngine.createSampler(url, '').then((sampler) => {
      props.track.source.dispose();
      // eslint-disable-next-line vue/no-mutating-props
      props.track.source = sampler
    }).catch((e) => {
      console.error(e)
    })
  }
}
</script>

<style lang="scss" scoped>
.waveform {
  width: clamp(350px, 60%, 1000px);
  border-radius: 0.5rem;
  padding: 0.25rem;
  border: 1px solid var(--color-grey-600);
  -webkit-transition: -webkit-filter 0.2s ease-in-out;
  -moz-transition: 0.2s -moz-filter ease-in-out;
  -ms-transition: 0.2s -ms-filter ease-in-out;
  -o-transition: 0.2s -o-filter ease-in-out;
  transition: 0.2s filter ease-in-out, 0.2s -webkit-filter ease-in-out;

  background-color: hsl(51, 60%, 69%);
  filter: hue-rotate(0deg) brightness(1) saturate(1);
}

.hover-text {
  opacity: 0;
  position: absolute;
  font-size: 3rem;
  transition: 0.2s opacity ease-in-out;
  color: var(--color-grey-900);
  text-shadow: -1px -1px 0 var(--color-grey-500),
  1px -1px 0 var(--color-grey-500),
  -1px 1px 0 var(--color-grey-500),
  1px 1px 0 var(--color-grey-500);
}

.ghost-button {
  cursor: pointer;
  display: contents;

  &:hover .waveform {
    outline: none;
    cursor: pointer;
    filter: hue-rotate(10deg) brightness(0.3) saturate(1.2);
  }

  &:hover .hover-text {
    opacity: 1;
  }
}
</style>
