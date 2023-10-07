import * as Tone from 'tone/Tone';
import type {Dictionary} from "~/lib/typescript.types";

export abstract class AbstractSource {
	protected _isInitialized: boolean = false;
	public abstract AVAILABLE_SETTINGS: string[]
	public drumMap: Map<Tone.Unit.Frequency, string> = new Map()
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
}
