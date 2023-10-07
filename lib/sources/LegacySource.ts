import * as Tone from 'tone/Tone';
import type {RecursivePartial} from "~/lib/typescript.types";
import {DEFAULT_NOTE} from "~/lib/Sequencer";
import {AbstractSource} from "~/lib/sources/AbstractSource";

export type AbstractSourceOptions = ({
	sampler?: never,
	synth: RecursivePartial<Tone.MonoSynthOptions>
} | {
	sampler: Partial<Tone.SamplerOptions>,
	synth?: never
}) & {
	filter?: Partial<Tone.FilterOptions>,
	filterEnvelope?: Partial<Tone.FrequencyEnvelopeOptions>
}

export default class LegacySource extends AbstractSource {
	private _sampler?: Tone.Sampler;
	private _synth?: Tone.MonoSynth;
	
	private readonly _filter: Tone.Filter;
	private readonly _filterEnvelope: Tone.FrequencyEnvelope;

	private _options!: AbstractSourceOptions;
	
	public AVAILABLE_SETTINGS: string[] = ['slide'];
	
	constructor(options: AbstractSourceOptions) {
		super();
		
		this._options = options;
		
		if (!this._options.sampler && !this._options.synth) {
			throw new Error('No options provided for AbstractSource')
		}
		
		const filterOptions: Partial<Tone.FilterOptions> = options.filter ?? {
			frequency: Tone.Frequency(20000, 'hz').toFrequency(),
			type: 'lowpass',
			rolloff: -12,
		}
		
		this._filter = new Tone.Filter(filterOptions)
		
		const filterEnvelopeOptions: Partial<Tone.FrequencyEnvelopeOptions> = options.filterEnvelope ?? {
			attack: 0.01,
			decay: 0.01,
			sustain: 0,
			release: 0.1,
			octaves: 4,
			baseFrequency: 20000,
		}
		
		this._filterEnvelope = new Tone.FrequencyEnvelope(filterEnvelopeOptions)
		
		this._filterEnvelope.connect(this._filter.frequency)
		this._filter.frequency.overridden = false;
	}

	private get filterEnvelope(): Tone.FrequencyEnvelope {
		return this._filterEnvelope;
	}

	private get filter(): Tone.Filter {
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
		
		const isString = (str: any) => {
			return typeof str === 'string' || str instanceof String;
		}
		
		const hasHttpInUrl = this._options.sampler?.urls &&
			isString(this._options.sampler.urls[DEFAULT_NOTE]) &&
			(this._options.sampler.urls[DEFAULT_NOTE] as string).includes('http')
		
		if (this._options.sampler) {
			this._sampler = new Tone.Sampler({
				volume: -6,
				release: 1,
				urls: this._options.sampler.urls,
				baseUrl: hasHttpInUrl ? '' : '/samples/',
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
			this._synth = new Tone.MonoSynth(this._options.synth)
			
			this._synth.set({envelope: this._options.synth.envelope})
			
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
		
		this._filter.disconnect();
	}
	
	public chain(...args: Tone.ToneAudioNode[]): void {
		if (this.isSampler) {
			this._sampler!.chain(this.filter, ...args);
		} else {
			this._synth!.chain(this.filter, ...args);
		}
	}
	
	public triggerAttackRelease(note: Tone.Unit.Frequency, duration: Tone.Unit.Time, time?: Tone.Unit.Time, velocity?: number): Tone.Sampler | Tone.MonoSynth {
		if (this.isSampler) {
			this._filterEnvelope.triggerAttackRelease(duration, time, velocity)
			
			return this._sampler!.triggerAttackRelease(note, duration, time, velocity);
		} else {
			this._filterEnvelope.triggerAttackRelease(duration, time, velocity)
			
			return this._synth!.triggerAttackRelease(note, duration, time, velocity);
		}
	}
	
	public dispose(): Tone.Sampler | Tone.MonoSynth {
		this._filterEnvelope.dispose();
		this._filter.dispose();
		
		if (this.isSampler) {
			return this._sampler!.dispose();
		} else {
			return this._synth!.dispose();
		}
	}
	
	public releaseAll(time?: Tone.Unit.Time): Tone.Sampler | undefined {
		if (this.isSampler) {
			this._filterEnvelope.triggerRelease(time)
			
			return this._sampler!.releaseAll(time);
		}
	}
	
	public triggerRelease(note: Tone.Unit.Frequency = DEFAULT_NOTE, time?: Tone.Unit.Time): Tone.Sampler | Tone.MonoSynth {
		this._filterEnvelope.triggerRelease(time)
		
		if (this.isSampler) {
			return this._sampler!.triggerRelease(note, time);
		} else {
			return this._synth!.triggerRelease(time);
		}
	}
	
	public triggerAttack(note: Tone.Unit.Frequency = DEFAULT_NOTE, time?: Tone.Unit.Time, velocity?: number): Tone.Sampler | Tone.MonoSynth {
		this._filterEnvelope.triggerAttack(time)
		
		if (this.isSampler) {
			return this._sampler!.triggerAttack(note, time, velocity);
		} else {
			return this._synth!.triggerAttack(note, time, velocity);
		}
	}
	
	public export(): AbstractSourceOptions {
		return {
			...this._options,
			filter: this._filter.get(),
			filterEnvelope: this._filterEnvelope.get(),
		};
	}
}
