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
} | Tone.Sampler

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
  
  //https://github.com/rrsolomon/The-Drum-Kit/raw/master/The%2520Modern%2520Kit/The%2520Modern%2520Drum%2520Kit%2520Samples/Kicks/16x24%2520-%2520DW%2520Collector's%2520Maple%2520w.Plastic%2520Beater/16x24%2520DW%2520Collectors%2520Maple%2520w.%2520Plastic%2520Beater%2520-%25201%2520-%2520Extra%2520Hard%252001.wav
  //https://github.com/rrsolomon/The-Drum-Kit/raw/master/The%20Modern%20Drum%20Kit%20Samples/Kicks/16x24%20-%20DW%20Collector's%20Maple%20w.Plastic%20Beater/16x24%20DW%20Collectors%20Maple%20w.%20Plastic%20Beater%20-%201%20-%20Extra%20Hard%2001.wav
  //https://github.com/rrsolomon/The-Drum-Kit/raw/master/The Modern Kit/The Modern Drum Kit Samples/Kicks/16x24 - DW Collector's Maple w.Plastic Beater/16x24 DW Collectors Maple w. Plastic Beater - 1 - Extra Hard 01.wav
  //https://github.com/rrsolomon/The-Drum-Kit/raw/master/The-Drum-Kit/The%20Modern%20Kit/The%20Modern%20Drum%20Kit%20Samples/Kicks/16x24%20-%20DW%20Collector's%20Maple%20w.Plastic%20Beater/16x24%20DW%20Collectors%20Maple%20w.%20Plastic%20Beater%20-%201%20-%20Extra%20Hard%2001.wav
  //The-Drum-Kit/The Modern Kit/The Modern Drum Kit Samples/Kicks/16x24 - DW Collector's Maple w.Plastic Beater/16x24 DW Collectors Maple w. Plastic Beater - 1 - Extra Hard 01.wav
  //https://github.com/rrsolomon/The-Drum-Kit/raw/master/The%20Modern%20Kit/The%20Modern%20Drum%20Kit%20Samples/Kicks/16x24%20-%20DW%20Collector's%20Maple%20w.Plastic%20Beater/16x24%20DW%20Collectors%20Maple%20w.%20Plastic%20Beater%20-%201%20-%20Extra%20Hard%2001.wav
  //https://github.com/rrsolomon/The-Drum-Kit/raw/master/The%20Modern%20Kit/The%20Modern%20Drum%20Kit%20Samples/Kicks/16x24%20-%20DW%20Collector's%20Maple%20w.Plastic%20Beater%20/16x24%20DW%20Collectors%20Maple%20w.%20Plastic%20Beater%20-%201%20-%20Extra%20Hard%2001.wav
  //https://github.com/rrsolomon/The-Drum-Kit/raw/master/The%20Modern%20Kit/The%20Modern%20Drum%20Kit%20Samples/Kicks/16x24%20-%20DW%20Collector's%20Maple%20w.Plastic%20Beater/16x24%20DW%20Collectors%20Maple%20w.%20Plastic%20Beater%20-%201%20-%20Extra%20Hard%2001.wav
  
  public static createSampler(samplePath: string, baseUrl: string = '/samples/'): Promise<Tone.Sampler> {
    return new Promise((resolve, reject) => {
      const _sampler = new Tone.Sampler({
        volume: -6,
        urls: {
          [DEFAULT_NOTE]: samplePath
        },
        release: 1,
        baseUrl,
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
