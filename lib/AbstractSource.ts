import * as Tone from 'tone/Tone';
import type {RecursivePartial} from "~/lib/typescript.types";
import {DEFAULT_NOTE} from "~/lib/Sequencer";

export type AbstractSourceOptions = {
	sampler?: never,
	synth: RecursivePartial<Tone.MonoSynthOptions>
} | {
	sampler: Partial<Tone.SamplerOptions>,
	synth?: never
}

export default class AbstractSource {
	
	private _sampler?: Tone.Sampler;
	private _synth?: Tone.MonoSynth;
	
	private readonly _filter: Tone.Filter;
	private readonly _filterEnvelope: Tone.FrequencyEnvelope;
	
	private _options!: AbstractSourceOptions;
	
	private _isInitialized: boolean = false;
	
	constructor(options: AbstractSourceOptions) {
		this._options = options;
		
		if (!this._options.sampler && !this._options.synth) {
			throw new Error('No options provided for AbstractSource')
		}
		
		this._filter = new Tone.Filter({
			frequency: Tone.Frequency(20000, 'hz').toFrequency(),
			type: 'lowpass',
			rolloff: -12,
		})
		
		this._filterEnvelope = new Tone.FrequencyEnvelope({
			// attack: 0,
			// decay: 1,
			// sustain: 1,
			// release: 1,
			attack: 0.01,
			decay: 0.01,
			sustain: 0,
			release: 0.1,
			octaves: 4,
			baseFrequency: 20000,
		})
		
		this._filterEnvelope.connect(this._filter.frequency)
		this._filter.frequency.overridden = false;
	}
	
	public get envelope(): Tone.Envelope | undefined {
		return this.isSampler ? undefined : this._synth!.envelope;
	}
	
	public get volume(): Tone.Param<"decibels"> {
		return this.isSampler ? this._sampler!.volume : this._synth!.volume;
	}
	
	public get attack(): Tone.Unit.Time {
		return this.isSampler ? this._sampler!.attack : this._synth!.envelope.attack
	}
	
	public get release(): Tone.Unit.Time {
		return this.isSampler ? this._sampler!.release : this._synth!.envelope.release
	}
	
	public get filterEnvelope(): Tone.FrequencyEnvelope {
		return this._filterEnvelope;
	}
	
	public get filter(): Tone.Filter {
		return this._filter;
	}
	
	private get isSampler(): boolean {
		if (!this._isInitialized) {
			throw new Error('AbstractSource is not initialized, call init() before using it')
		}
		
		return !!this._options.sampler;
	}
	
	public async init(): Promise<void> {
		let resolveFunc!: Function;
		let rejectFunc!: Function;
		
		const promise = new Promise((resolve, reject): void => {
			resolveFunc = resolve;
			rejectFunc = reject;
		});
		
		if (this._options.sampler) {
			this._sampler = new Tone.Sampler({
				volume: -6,
				release: 1,
				urls: this._options.sampler.urls,
				baseUrl: '/samples/',
				onload: () => {
					this._sampler!.connect(this._filter)
					resolveFunc(true)
				},
				onerror: (err) => {
					rejectFunc(err)
				}
			})
		}
		
		if (this._options.synth) {
			this._synth = new Tone.MonoSynth({
				oscillator: {
					type: 'pwm',
				},
				envelope: {
					attack: 0.01,
					decay: 0.42,
					sustain: 0.01,
					release: 0.25
				},
				filterEnvelope: {
					baseFrequency: 20000,
					attack: 0,
					decay: 1,
					sustain: 1,
					release: 1,
				},
				volume: -6,
				
				...this._options.synth
			})
			
			this._synth.connect(this._filter)
			
			resolveFunc(true);
		}
		
		await promise;
		this._isInitialized = true;
	}
	
	public get(): Tone.SamplerOptions | Tone.MonoSynthOptions {
		return this.isSampler ? this._sampler!.get() : this._synth!.get();
	}
	
	public set(options: Partial<Tone.SamplerOptions> | RecursivePartial<Tone.MonoSynthOptions>): void {
		if ('filter' in options) {
			this._filter!.set(options.filter as Partial<Tone.FilterOptions>);
			delete options.filter;
		}
		
		if ('filterEnvelope' in options) {
			this._filterEnvelope!.set(options.filterEnvelope as Partial<Tone.FrequencyEnvelopeOptions>);
			delete options.filterEnvelope;
		}
		
		if (this.isSampler) {
			this._sampler!.set(options);
			this._options.sampler = {
				...this._options.sampler,
				...options as Partial<Tone.SamplerOptions>
			};
		} else {
			this._synth!.set(options);
			this._options.synth = {
				...this._options.synth,
				...options as RecursivePartial<Tone.MonoSynthOptions>
			};
		}
	}
	
	public disconnect(): void {
		if (this.isSampler) {
			this._sampler!.disconnect();
		} else {
			this._synth!.disconnect();
		}
	}
	
	public chain(...args: Tone.ToneAudioNode[]): void {
		if (this.isSampler) {
			this._sampler!.chain(this.filter, ...args);
		} else {
			this._synth!.chain(this.filter, ...args);
		}
	}
	
	public triggerAttackRelease(note: string | Tone.Unit.Frequency, duration: Tone.Unit.Time, time?: Tone.Unit.Time, velocity?: number): Tone.Sampler | Tone.MonoSynth {
		if (this.isSampler) {
			this._filterEnvelope.triggerAttackRelease(duration, time, velocity)
			
			return this._sampler!.triggerAttackRelease(note, duration, time, velocity);
		} else {
			this._filterEnvelope.triggerAttackRelease(duration, time, velocity)
			
			return this._synth!.triggerAttackRelease(note, duration, time, velocity);
		}
	}
	
	public dispose(): Tone.Sampler | Tone.MonoSynth {
		if (this.isSampler) {
			return this._sampler!.dispose();
		} else {
			return this._synth!.dispose();
		}
	}
	
	public releaseAll(time?: Tone.Unit.Time): Tone.Sampler | undefined {
		if (this.isSampler) {
			return this._sampler!.releaseAll(time);
		}
	}
	
	public triggerRelease(note: Tone.Unit.Frequency = DEFAULT_NOTE, time?: Tone.Unit.Time): Tone.Sampler | Tone.MonoSynth {
		if (this.isSampler) {
			return this._sampler!.triggerRelease(note, time);
		} else {
			return this._synth!.triggerRelease(time);
		}
	}
	
	public triggerAttack(note: Tone.Unit.Frequency = DEFAULT_NOTE, time?: Tone.Unit.Time, velocity?: number): Tone.Sampler | Tone.MonoSynth {
		if (this.isSampler) {
			return this._sampler!.triggerAttack(note, time, velocity);
		} else {
			return this._synth!.triggerAttack(note, time, velocity);
		}
	}
}
