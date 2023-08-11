import type {GridCell} from './Sequencer'
import {DEFAULT_NOTE} from './Sequencer'
import * as Tone from 'tone/Tone'
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

export type AudioSource = Tone.PolySynth<Tone.MonoSynth> & {
  attack: Tone.Unit.Time | number
  release: Tone.Unit.Time | number
  envelope: any
}

export enum TrackTypes {
  'synth' = 'synth',
  'sample' = 'sample'
}

export class SoundEngine {
	private static instance: SoundEngine;
	
	public static getInstance(): SoundEngine {
		if (!SoundEngine.instance) {
			SoundEngine.instance = new SoundEngine();
		}
		
		return SoundEngine.instance;
	}
  
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

  public static createInstrument(): Tone.PolySynth<any> {
    const synth = new Tone.PolySynth(Tone.MonoSynth, {
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
    
    synth.maxPolyphony = 8
    
    return synth
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
  
  public playStepData(time: Tone.Unit.Time, stepData: GridCell[]): void {
    this.tracks.forEach((track, trackIndex) => {
      if (!track.isSolo.value || track.isMuted.value) {
        return
      }
      
      if (stepData[trackIndex] === undefined || stepData[trackIndex].velocity === 0) {
        return
      }
      
      track.source.releaseAll(time).triggerAttackRelease(stepData[trackIndex].note, '16n', time, stepData[trackIndex].velocity / 100)
    })
  }
}
