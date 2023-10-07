import {AbstractSource} from "~/lib/sources/AbstractSource";
import type {ToneAudioNode} from "tone/Tone";
import * as Tone from 'tone/Tone';
import {WebAudioTinySynth} from "~/modules/webaudio-tinysynth";

export class TinySource extends AbstractSource {
	declare protected _voice: WebAudioTinySynth
	AVAILABLE_SETTINGS: string[] = []
	private _options!: any
	private output: Tone.Gain = new Tone.Gain();
	
	constructor(options: any) {
		super()
		this._options = options
		
		this._voice = new WebAudioTinySynth({})
		this._voice.setAudioContext(Tone.Destination)
		this._voice.setProgram(1, 40)
		
		for (let i = 0; i < 16; i++) {
			this._voice.chvol[i]?.toDestination()
		}
	}
	
	public async init(): Promise<void> {
		this._isInitialized = true;
		
		console.log('smplr init ++')
	}
	
	chain(...args: ToneAudioNode[]): any {
		// this._voice.output.addInsert(this.output)
		console.log('smplr chain ++')
		// this.output.chain(...args)
	}
	
	disconnect(): void {
		// this.output.disconnect()
	}
	
	export(): any {
		return this._options;
	}
	
	get(): any {
		return this._options;
	}
	
	releaseAll(note?: any, time?: Tone.Unit.Time): void {
		return
	}
	
	set(options: any): void {
	
	}
	
	triggerAttack(note: Tone.Unit.Frequency, time?: Tone.Unit.Time, velocity?: number): void {
		this._voice.noteOn(1, Tone.Frequency(note).toMidi(), velocity ?? 100, Tone.Time(time).toSeconds());
	}
	
	triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity?: number): void {
		this._voice.noteOn(1, Tone.Frequency(note).toMidi(), velocity ?? 100);
	}
	
	triggerRelease(note?: Tone.Unit.Frequency, time?: Tone.Unit.Time): void {
		this._voice.noteOff(1, Tone.Frequency(note).toMidi(), Tone.Time(time).toSeconds());
	}
	
}
