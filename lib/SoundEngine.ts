import * as Tone from 'tone/Tone'
import type {Ref, ShallowRef} from "vue";
import {ref, shallowRef, triggerRef} from "vue";
import {GRID_ROWS} from "@/constants";
import {Track} from "~/lib/Track";

export type ADSRType = {
  attack: number
  decay: number
  sustain: number
  release: number
}

export enum SOURCE_TYPES {
  'legacyMono' = 'legacyMono',
  'sampler' = 'sampler',
  'RNBO_Sub' = 'sub',
  'RNBO_Synth' = 'synth',
  'RNBO_Acid' = 'acid',
  'SMPLR_Instrument' = 'smplr_instrument',
  'SMPLR_Drum' = 'smplr_drum',
  'PulseqMono' = 'PulseqMono',
  'MIDIOut' = 'MIDISource'
  // 'TINYSYNTH' = 'tinysynth',
}

export class SoundEngine {
	private static instance: SoundEngine;
  
  public FFTValues: ShallowRef<Float32Array> = shallowRef(new Float32Array(32));
  // TODO: check if we really should use 32 instead of, hm, anything else
  private FFT: Tone.FFT = new Tone.FFT(32);
	
	public static getInstance(): SoundEngine {
		if (!SoundEngine.instance) {
			SoundEngine.instance = new SoundEngine();
		}
		
		return SoundEngine.instance;
	}
  
  public tracks: ShallowRef<Track[]> = shallowRef([])
  
  public tracksCount: Ref<number> = ref(GRID_ROWS);
  
  public sidechainEnvelopeSource?: Tone.Envelope;
  
  constructor() {
  }
  
  public addTrack(track: Track): Track {
    if (!track.source) {
      throw new Error('No source provided for track')
    }
    
    this.tracks.value.push(track)
    
    this.tracksCount.value = this.tracks.value.length;
    
    triggerRef(this.tracks)
    
    return track
  }

  public removeTrack(trackName: string): void {
    const trackIndex = this.tracks.value.findIndex((track) => track.name === trackName)

    if (trackIndex === -1) {
      throw new Error(`No track found with name ${trackName}`)
    }
    
    this.tracks.value.splice(trackIndex, 1)
    
    this.tracksCount.value = this.tracks.value.length;
    
    triggerRef(this.tracks)
  }

  public clearTracks(): void {
    this.tracks.value = []
    this.tracksCount.value = this.tracks.value.length;
    triggerRef(this.tracks)
    
  }
  
  public toggleSidechain(
    trackFrom: Track,
    trackTo: Track,
    defaultEnv?: { attack: number, decay: number, sustain: number, release: number }
  ): void {
    this.sidechainEnvelopeSource = trackFrom.toSidechainSource(defaultEnv?.attack, defaultEnv?.decay, defaultEnv?.sustain, defaultEnv?.release)
    
    trackTo.toggleSidechain(this.sidechainEnvelopeSource)
  }
  
  public addFFTAnalyzer(track: Track): void {
    this.stopFFTAnalyzer()
    
    this.FFTUpdateLoop = this.FFTUpdateLoopCallback
    track.channel.connect(this.FFT);
    
    this.FFTUpdateLoop();
  }
  
  public stopFFTAnalyzer(): void {
    this.FFTUpdateLoop = this.noOp
    this.FFT.dispose()
    this.FFT = new Tone.FFT({
      smoothing: 0.2,
      size: 64
    });
  }
  
  private FFTUpdateLoop = () => {
  }
  
  private noOp = () => {
  }
  
  private readonly FFTUpdateLoopCallback = () => {
    setTimeout(() => {
      requestAnimationFrame(this.FFTUpdateLoop);
      this.FFTValues.value = this.FFT.getValue();
    }, 1000 / 20);
  }
  
  public triggerTracksUpdated(): void {
    triggerRef(this.tracks)
  }
}
