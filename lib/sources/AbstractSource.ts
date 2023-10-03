import * as Tone from 'tone/Tone';
import type {Dictionary} from "~/lib/typescript.types";

export abstract class AbstractSource {
	protected _isInitialized: boolean = false;

	constructor() {
	}

	public async init(): Promise<void> {
		this._isInitialized = true;
	}

	public abstract get(): Dictionary;

	public abstract set(options: Dictionary, time: number): void;

	public abstract export(): Dictionary;

	public abstract disconnect(): any

	public abstract chain(...args: Tone.ToneAudioNode[]): any;

	public abstract triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity?: number): any

	public abstract releaseAll(time?: Tone.Unit.Time): any

	public abstract triggerRelease(note: Tone.Unit.Frequency, time?: Tone.Unit.Time): any

	public abstract triggerAttack(note: Tone.Unit.Frequency, time?: Tone.Unit.Time, velocity?: number): any
}
