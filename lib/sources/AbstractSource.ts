import * as Tone from 'tone/Tone';
import type {Dictionary} from "~/lib/typescript.types";
import type {Ref} from "vue";
import {ref} from "vue";

export abstract class AbstractSource {
	protected _isInitialized: boolean = false;
	public abstract AVAILABLE_SETTINGS: string[]
	public drumMap: Map<Tone.Unit.Frequency, string> = new Map()
	public selectedPreset: Ref<string> = ref('')

	protected _voice: any;

	constructor() {
	}

	public async init(): Promise<void> {
		this._isInitialized = true;
	}

	public abstract get(): Dictionary;
	
	public abstract set(options: Dictionary, time?: number): void;

	public abstract export(): Dictionary;
	
	public abstract disconnect(): void
	
	public abstract chain(...args: Tone.ToneAudioNode[]): void;
	
	public abstract triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time: Tone.Unit.Time, velocity?: number): void
	
	public abstract releaseAll(time?: Tone.Unit.Time): void
	
	public abstract triggerRelease(note?: Tone.Unit.Frequency, time?: Tone.Unit.Time): void
	
	public abstract triggerAttack(note: Tone.Unit.Frequency, time?: Tone.Unit.Time, velocity?: number): void
	
	public convertNoteToDrum(note: Tone.Unit.Frequency): any {
		return Tone.Frequency(note, 'midi').toNote()
	}

	public slideTo(note: Tone.Unit.Frequency, volumeMod: number, time: Tone.Unit.Time, duration: Tone.Unit.Time): void {
		console.warn('glideTo not implemented for this source, triggering as usual', note, volumeMod, time, duration);
		this.triggerAttackRelease(note, duration, time, volumeMod);
	}

	public getPresets(): string[] {
		return []
	}

	public setPreset(preset: string): void {
		console.warn('setPreset not implemented for this source', preset);
	}
}
