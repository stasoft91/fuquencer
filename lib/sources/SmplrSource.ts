import {AbstractSource} from "~/lib/sources/AbstractSource";
import type {ToneAudioNode} from "tone/Tone";
import * as Tone from 'tone/Tone';
import {Soundfont, type SoundfontOptions} from "~/modules/tonejs-smplr/src";
import type {SampleStart} from "~/modules/tonejs-smplr/src/player/types";

export class SmplrSource extends AbstractSource {
	AVAILABLE_SETTINGS: string[] = ['lpfCutoffHz', 'decayTime', 'playbackRate', 'reverse']
	protected declare _voice: Soundfont
	private options!: SoundfontOptions
	private _playbackOptions: Partial<SampleStart> = {
		decayTime: undefined,
		reverse: false,
	}
	private output: Tone.Gain = new Tone.Gain();
	
	constructor(options: SoundfontOptions, ignoreVoice: boolean = false) {
		super()
		this.options = options
		!ignoreVoice && (this._voice = new Soundfont({
			...this.options,
			destination: this.output
		}))
	}
	
	public async init(): Promise<void> {
		await this._voice.load
		this._isInitialized = true;
	}
	
	chain(...args: ToneAudioNode[]): any {
		this.output.chain(...args)
	}
	
	disconnect(): void {
		this.output.disconnect()
	}
	
	export(): SoundfontOptions {
		return this.options;
	}
	
	get(): SoundfontOptions {
		return this.options;
	}
	
	releaseAll(note?: any, time?: Tone.Unit.Time): void {
		// intentionally blank
	}
	
	set(options: SampleStart): void {
		this._playbackOptions = options
	}
	
	triggerAttack(note: Tone.Unit.Frequency, time?: Tone.Unit.Time, velocity?: number): void {
		this._voice.start({
			note: this.convertNoteToDrum(Tone.Frequency(note).toMidi()),
			velocity: (velocity ?? 100),
			time: Tone.Time(time).toSeconds(),
			duration: 1000,
			reverse: this._playbackOptions.reverse,
			playbackRate: this._playbackOptions.playbackRate,
		})
	}
	
	triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity?: number): void {
		this._voice.start({
			note: this.convertNoteToDrum(Tone.Frequency(note).toMidi()),
			velocity: (velocity ?? 100),
			time: Tone.Time(time).toSeconds(),
			duration: Tone.Time(duration).toSeconds(),
			decayTime: this._playbackOptions.decayTime,
			reverse: this._playbackOptions.reverse,
			playbackRate: this._playbackOptions.playbackRate,
		})
	}
	
	triggerRelease(note?: Tone.Unit.Frequency, time?: Tone.Unit.Time): void {
		this._voice.stop({
			time: Tone.Time(time).toSeconds(),
		})
	}
}
