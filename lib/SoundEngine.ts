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
  
  public sidechainEnvelopeSource?: Tone.Envelope;
  
  constructor() {
  }
  
  public addTrack(track: Track): Track {
    if (!track.source) {
      throw new Error('No source provided for track')
    }

    this.tracks.push(track)
    
    return track
  }

  public removeTrack(trackName: string): void {
    const trackIndex = this.tracks.findIndex((track) => track.name === trackName)

    if (trackIndex === -1) {
      throw new Error(`No track found with name ${trackName}`)
    }

    this.tracks.splice(trackIndex, 1)
    
    this.tracksCount.value = this.tracks.length;
  }

  public clearTracks(): void {
    this.tracks = []
    this.tracksCount.value = this.tracks.length;
  }
  
  public toggleSidechain(
    trackFrom: Track,
    trackTo: Track,
    defaultEnv?: { attack: number, decay: number, sustain: number, release: number }
  ): void {
    this.sidechainEnvelopeSource = trackFrom.toSidechainSource(defaultEnv?.attack, defaultEnv?.decay, defaultEnv?.sustain, defaultEnv?.release)
    
    trackTo.toggleSidechain(this.sidechainEnvelopeSource)
  }
}
