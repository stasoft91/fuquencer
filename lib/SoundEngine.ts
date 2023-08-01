import type {GridCell} from './Sequencer'
import {DEFAULT_NOTE} from './Sequencer'
import * as Tone from 'tone/Tone'
import type {AmplitudeEnvelope} from 'tone/Tone/component/envelope/AmplitudeEnvelope'
import type {Ref} from "vue";
import {reactive, ref} from "vue";
import {GRID_ROWS} from "@/constants";
import {Track} from "~/lib/Track";

export type ADSRType = {
  attack: number
  decay: number
  sustain: number
  release: number
}

export type AudioSource = Tone.MonoSynth & {
  attack: Tone.Unit.Time | number
  release: Tone.Unit.Time | number
  envelope: AmplitudeEnvelope
};

export enum TrackTypes {
  'synth' = 'synth',
  'sample' = 'sample'
}

export class SoundEngine {
  public tracks: Track[] = reactive([])
  
  public tracksCount: Ref<number> = ref(GRID_ROWS);
  
  private signalFollower?: Tone.Follower;
  
  constructor() {
  }

  public addTrack(track: Track): void {
    if (!track.source) {
      throw new Error('No source provided for track')
    }

    this.tracks.push(track)
  }

  public removeTrack(trackName: string): void {
    const trackIndex = this.tracks.findIndex((track) => track.name === trackName)

    if (trackIndex === -1) {
      throw new Error(`No track found with name ${trackName}`)
    }

    this.tracks.splice(trackIndex, 1)
    
    this.tracksCount.value = this.tracks.length;
  }

  public playStepData(time: Tone.Unit.Time, stepData: GridCell[]): void {
    let tracks = this.tracks.filter((_) => _.isSolo.value)

    if (tracks.length === 0) {
      tracks = this.tracks
    }
    
    tracks = tracks.filter((_) => !_.isMuted.value)

    tracks.forEach((track, trackIndex) => {
      const trackStepData = stepData[trackIndex]

      if (trackStepData === undefined || trackStepData.velocity === 0) {
        return
      }

      if (track.type === TrackTypes.sample) {
        track.source.triggerAttackRelease(trackStepData.note, '16n', time, trackStepData.velocity / 100)
      } else {
        track.source.triggerAttackRelease(
          trackStepData.note,
          '16n',
          time,
          trackStepData.velocity / 100
        )
      }
    })
  }

  public clearTracks(): void {
    this.tracks = []
    this.tracksCount.value = this.tracks.length;
  }
  
  public toggleSidechain(trackFrom: Track, trackTo: Track): void {
    if (this.signalFollower === undefined) {
      this.signalFollower = trackFrom.toSidechainSource()
    }
    
    trackTo.toggleSidechain(this.signalFollower)
  }

  public static createSampler(samplePath: string): Promise<Tone.Sampler> {
    return new Promise((resolve, reject) => {
      const _sampler = new Tone.Sampler({
        volume: -6,
        urls: {
          [DEFAULT_NOTE]: samplePath
        },
        release: 1,
        baseUrl: '/samples/',
        onload: () => {
          _sampler.toDestination()
          resolve(_sampler)
        },
        onerror: (err) => {
          reject(err)
        }
      })
    })
  }

  public static createInstrument(): Tone.MonoSynth {
    return new Tone.MonoSynth({
      oscillator: {
        type: 'pwm'
      },
      envelope: {
        attack: 0.01,
        decay: 0.5,
        sustain: 0
      },
      filterEnvelope: {
        attack: 0.001,
        decay: 0.01,
        sustain: 0.5,
      },
      volume: -6
    }).toDestination()
  }
}
