import type {ADSRType} from "~/lib/SoundEngine";
import {TrackTypes} from "~/lib/SoundEngine";
import type {Ref, ShallowRef} from "vue";
import {ref, shallowReactive, shallowRef} from "vue";
import {getEnvelopeOfAudioSource} from "~/lib/utils/getEnvelopeOfAudioSource";
import * as Tone from "tone/Tone";
import type {UniversalEffect} from "~/lib/Effects.types";
import type {LoopOptions} from "~/lib/PolyrhythmLoop";
import {PolyrhythmLoop} from "~/lib/PolyrhythmLoop";
import {Sequencer} from "~/lib/Sequencer";
import type {AbstractSourceOptions} from "~/lib/AbstractSource";
import AbstractSource from "~/lib/AbstractSource";

export type TrackOptions = {
	name: string,
	volume: number,
	source: AbstractSource,
	type: TrackTypes
}

export type TrackExportOptions = Omit<TrackOptions, 'source'> & {
	source: AbstractSourceOptions,
	middlewares: UniversalEffect[],
	envelope: ADSRType,
	length: number,
	loops: Omit<LoopOptions, 'track'>[],
}

export class Track {
	private _volume: Ref<number>;
	private _type: Ref<TrackTypes>;
	private _envelope: Ref<ADSRType>;
	private _name: Ref<string>;

	public channel: Tone.Channel = new Tone.Channel();
	
	constructor(params: TrackOptions) {
		const {name, volume, source, type} = params;

		this._name = ref(name);
		this._volume = ref(volume);
		this._source = source;
		this._type = ref(type);
		this._envelope = ref(getEnvelopeOfAudioSource(source));
		
		this.reconnectMiddlewares();
	}
	
	private _sidechainEnvelope: Tone.Envelope | undefined = undefined;

	private _loops: ShallowRef<PolyrhythmLoop[]> = shallowRef([]);
	private _middlewares = shallowReactive({value: [] as UniversalEffect[]});
	
	private _source: AbstractSource;

	private _length: Ref<number> = ref(16);

	private _meta: Ref<Map<string, any>> = ref(new Map());

	public get name(): string {
		return this._name.value;
	}

	public set name(value: string) {
		this._name.value = value;
	}

	public get volume(): number {
		return this._volume.value;
	}
	
	public set volume(value: number) {
		this._volume.value = value;
		try {
			this._source.volume.value = value;
		} catch (e) {
			console.log('error', e);
		}
	}
	
	public get type(): TrackTypes {
		return this._type.value;
	}
	
	public set type(value: TrackTypes) {
		this._type.value = value;
	}
	
	public get envelope(): ADSRType {
		return this._envelope.value;
	}
	
	public get middlewares(): UniversalEffect[] {
		return this._middlewares.value;
	}
	
	public get source(): AbstractSource {
		return this._source;
	}
	
	public set source(newSource: AbstractSource) {
		this._source = newSource;
	}
	
	/**
	 * Map of all the properties of the track (reactive)
	 * @returns {Map<string, any>}
	 */
	public get meta(): Map<string, any> {
		if (this._meta.value.size === 0) {
			const keys = new Set([
				...Object.keys(this._source.get()),
				'filter',
				'filterEnvelope',
			]);
			const meta = new Map<string, string>();
			let originalOptions: unknown = this._source.get();
			
			keys.forEach((key) => {
				if (key === 'filter') {
					originalOptions = {filter: this._source.filter.get()};
				}
				if (key === 'filterEnvelope') {
					originalOptions = {filterEnvelope: this._source.filterEnvelope.get()};
				}
				
				meta.set(key, Object.entries(originalOptions as Record<string, string>).find(([k]) => k === key)?.[1] as string);
			});
			
			this._meta.value = meta;
		}
		return this._meta.value;
	}
	
	public addMiddleware(middleware: UniversalEffect | UniversalEffect[]): void {
		this._middlewares.value = this._middlewares.value.concat(middleware);
		this.reconnectMiddlewares();
	}
	
	public get sidechainEnvelope(): Tone.Envelope | undefined {
		return this._sidechainEnvelope;
	}
	
	public removeMiddleware(middleware: UniversalEffect): void {
		this._middlewares.value = this._middlewares.value.filter((m) => m.name !== middleware.name);
		this.reconnectMiddlewares();
	}
	
	public clearMiddlewares(): void {
		this._middlewares.value = this._middlewares.value.map((middleware) => {
			middleware.effect?.dispose();
			middleware.effect = undefined;
			return middleware
		});
		
		this._middlewares.value = []
		
		this.reconnectMiddlewares();
	}
	
	/*
	 * Starts with 1
	 */
	public get length(): number {
		return this._length.value;
	}
	
	public getLoops() {
		return shallowRef(this._loops);
	}
	
	public static async importFrom(trackOptions: TrackExportOptions): Promise<Track> {
		const source = new AbstractSource(trackOptions.source)
		await source.init();
		
		const newTrack = new Track({
			name: trackOptions.name,
			volume: trackOptions.volume,
			source,
			type: trackOptions.type,
		});
		
		newTrack._length.value = trackOptions.length;
		
		trackOptions.middlewares.filter(_ => _.name !== 'AutoDuck').forEach((middleware) => {
			newTrack.addMiddleware(middleware);
		});
		
		trackOptions.loops.forEach((loop) => {
			newTrack.addLoop(loop);
		});
		
		return newTrack;
	}
	
	public removeLoop(loop: PolyrhythmLoop): void {
		this._loops.value = this._loops.value.filter((l) => l.name !== loop.name);
	}
	
	public addLoop(loop: Omit<LoopOptions, 'track' | 'context'>): PolyrhythmLoop {
		const newLoop = (new PolyrhythmLoop({...loop, track: this}) as PolyrhythmLoop)
		
		this._loops.value = [
			...this._loops.value,
			newLoop,
		]
		
		return newLoop
	}
	
	public reconnectMiddlewares(): void {
		this._middlewares.value.map((middleware) => {
			if (middleware.effect && !middleware.effect.disposed) {
				if (middleware.name === 'AutoDuck' && this._sidechainEnvelope) {
					this._sidechainEnvelope.set(middleware.options as Tone.EnvelopeOptions);
				} else {
					middleware.effect.set(middleware.options);
				}
				
				return;
			}
			
			if (middleware.name === 'AutoDuck' && this._sidechainEnvelope) {
				// EFFECT IS AUTODUCK
				middleware.effect?.disconnect().dispose();
				const effect = new Tone.Volume() as Tone.Volume;
				effect.volume.value = -Infinity;
				
				const scale = new Tone.Scale(0, -1);
				scale.connect(effect.volume);
				
				this._sidechainEnvelope.set(middleware.options as Tone.EnvelopeOptions);
				this._sidechainEnvelope?.connect(scale);
				
				middleware.effect = effect;
				
			} else if (middleware.name !== 'AutoDuck') {
				// EFFECT IS ANY OTHER EFFECT
				// @ts-ignore
				middleware.effect = new Tone[middleware.name](middleware.options);
				
			} else if (middleware.name === 'AutoDuck' && !this._sidechainEnvelope) {
				console.error('You need to add a sidechain source to use AutoDuck');
				return undefined;
			}
		});
		
		this._middlewares.value.filter(_ => _).map((middleware) => middleware.effect).forEach(effect => effect?.disconnect())
		
		this._source.disconnect();
		this.channel.disconnect();
		
		this._source.chain(
			...this._middlewares.value.filter(_ => _).map((middleware) => middleware.effect) as Tone.ToneAudioNode[],
			this.channel,
			Tone.Destination
		);
	}
	
	public setToSource(keyOrObject: string | Object, value?: any): void {
		if (typeof keyOrObject === 'object') {
			const entries = Object.entries(keyOrObject);
			entries.forEach((key) => {
				this._source.set({[key[0]]: key[1]});
				this._meta.value.set(key[0], key[1]);
			});
		} else {
			this._source.set({[keyOrObject]: value});
			this._meta.value.set(keyOrObject, value);
		}
	}
	
	public setToChannel(key: string, value?: any): void {
		this.channel.set({[key]: value});
		
		this._meta.value.set(key, value);
	}
	
	public toSidechainSource(attack = 0, decay = 0, sustain = 0.42, release = 0.1): Tone.Envelope {
		if (!this._sidechainEnvelope) {
			this._sidechainEnvelope = new Tone.Envelope(attack, decay, sustain, release);
		} else {
			this._sidechainEnvelope.set({attack, decay, sustain, release});
		}
		
		this.reconnectMiddlewares()
		
		return this._sidechainEnvelope
	}
	
	public toggleSidechain(env: Tone.Envelope): void {
		this._sidechainEnvelope = env;
		
		if (this._middlewares.value.find((middleware) => middleware.name === 'AutoDuck')) {
			this.removeMiddleware({
				name: 'AutoDuck',
			})
			return
		}
		
		this.addMiddleware({
			name: 'AutoDuck',
			options: {
				attack: env.attack || 0,
				decay: env.decay || 0,
				sustain: env.sustain || 0.42,
				release: env.release || 0,
			}
		})
	}
	
	public export(): TrackExportOptions {
		return {
			name: this.name,
			volume: this.volume,
			source: this.source.export(),
			type: this.type,
			middlewares: this.middlewares.map(_ => ({
				name: _.name,
				options: {..._.options, ..._.effect.get()},
				effect: undefined,
			})) as UniversalEffect[],
			envelope: this.envelope,
			length: this.length,
			loops: this._loops.value.map((loop) => ({
				...loop.export()
			})),
		}
	}
	
	public setLength(length: number): void {
		this._length.value = length;
		
		const seq = Sequencer.getInstance();
		const trackNumber = seq.soundEngine.tracks.value.findIndex((t) => t.name === this.name) + 1;
		seq.updatePartDuration(trackNumber, length);
	}
}
