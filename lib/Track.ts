import type {ADSRType, AudioSource} from "~/lib/SoundEngine";
import {TrackTypes} from "~/lib/SoundEngine";
import type {Ref, ShallowRef} from "vue";
import {ref, shallowReactive, shallowRef} from "vue";
import {getEnvelopeOfAudioSource} from "~/lib/utils/getEnvelopeOfAudioSource";
import * as Tone from "tone/Tone";
import type {UniversalEffect} from "~/lib/Effects.types";
import type {LoopParams} from "~/lib/PolyrhythmLoop";
import {PolyrhythmLoop} from "~/lib/PolyrhythmLoop";
import {Sequencer} from "~/lib/Sequencer";

export class Track {
	private _volume: Ref<number>;
	private _type: Ref<string>;
	private _envelope: Ref<ADSRType>;
	private _filterEnvelopeFrequency: Ref<number> = ref(0);
	private _name: Ref<string>;
	
	public channel: Tone.Channel = new Tone.Channel();
	
	public isSolo: Ref<boolean> = ref(true);
	
	private _source: AudioSource;
	private _sidechainEnvelope: Tone.Envelope | undefined = undefined;
	
	private _loops: ShallowRef<PolyrhythmLoop[]> = shallowRef([]);
	private _middlewares = shallowReactive({value: [] as UniversalEffect[]});
	
	constructor(params: { name: string, volume: number, source: AudioSource, type: TrackTypes }) {
		const {name, volume, source, type} = params;
		
		this._name = ref(name);
		this._volume = ref(volume);
		this._source = source;
		this._type = ref(type);
		this._envelope = ref(getEnvelopeOfAudioSource(source));
		
		const sourceSettings = this._source.get();
		if ("filterEnvelope" in sourceSettings) {
			this._filterEnvelopeFrequency.value = sourceSettings.filterEnvelope.baseFrequency as number || 0;
		}
		
		this.reconnectMiddlewares();
	}

	private _length: Ref<number> = ref(16);
	
	private _meta: Ref<Map<string, any>> = ref(new Map());
	
	
	public get filterEnvelopeFrequency(): number {
		return this._filterEnvelopeFrequency.value;
	}
	
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
	
	public get type(): string {
		return this._type.value;
	}
	
	public set type(value: string) {
		this._type.value = value;
	}
	
	public get envelope(): ADSRType {
		return this._envelope.value;
	}
	
	public get middlewares(): UniversalEffect[] {
		return this._middlewares.value;
	}
	
	public get source(): AudioSource {
		return this._source;
	}
	
	public get meta(): Map<string, any> {
		if (this._meta.value.size === 0) {
			const keys = Object.keys(this._source.get());
			const meta = new Map<string, string>();
			keys.forEach((key) => {
				meta.set(key, Object.entries(this._source.get()).find(([k]) => k === key)?.[1] as string);
			});
			this._meta.value = meta;
		}
		return this._meta.value;
	}
	
	public set source(newSource: AudioSource | Tone.Sampler) {
		this._source = newSource;
	}
	
	public addMiddleware(middleware: UniversalEffect | UniversalEffect[]): void {
		this._middlewares.value = this._middlewares.value.concat(middleware);
		this.reconnectMiddlewares();
	}
	
	public set envelope(envelope: ADSRType) {
		this._envelope.value = envelope;
		
		this._source.set({
			envelope,
			// @ts-ignore
			attack: envelope.attack || this._source.attack || 0,
			// @ts-ignore
			release: envelope.release || this._source.release || 0
		})
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
	
	public reconnectMiddlewares(): void {
		this._source.disconnect();
		
		this._middlewares.value.map((middleware) => {
			middleware.effect?.dispose();
			middleware.effect = undefined;
			
			if (middleware.name === 'AutoDuck' && this._sidechainEnvelope) {
				middleware.effect = new Tone.Gain(1, "normalRange");
				const scale = new Tone.Scale(1, 0);
				scale.connect(middleware.effect.gain);
				
				this._sidechainEnvelope.set(middleware.options as Tone.EnvelopeOptions);
				this._sidechainEnvelope?.connect(scale);
				
			} else if (middleware.name !== 'AutoDuck') {
				// @ts-ignore
				middleware.effect = new Tone[middleware.name](middleware.options);
				
			} else if (middleware.name === 'AutoDuck' && !this._sidechainEnvelope) {
				console.error('You need to add a sidechain source to use AutoDuck');
				return undefined;
			}
		});
		
		this._source.chain(
			...this._middlewares.value.filter(_ => _).map((middleware) => middleware.effect) as Tone.ToneAudioNode[],
			this.channel,
			Tone.Destination
		);
	}
	
	public setFilterCutoff(value: number): void {
		this._filterEnvelopeFrequency.value = value;
		this._source.set({filterEnvelope: {baseFrequency: value}});
	}
	
	public getLoops() {
		return shallowRef(this._loops);
	}
	
	public addLoop(loop: Omit<LoopParams, 'track' | 'context'>): PolyrhythmLoop {
		const newLoop = (new PolyrhythmLoop({...loop, track: this}) as PolyrhythmLoop)
		
		this._loops.value = [
			...this._loops.value,
			newLoop,
		]
		
		return newLoop
	}
	
	public removeLoop(loop: PolyrhythmLoop): void {
		this._loops.value = this._loops.value.filter((l) => l.name !== loop.name);
	}
	
	public toSidechainSource(): Tone.Envelope {
		this._sidechainEnvelope?.dispose();
		this._sidechainEnvelope = new Tone.Envelope(0, 0.2, 0, 0);
		
		this.reconnectMiddlewares()
		
		return this._sidechainEnvelope
	}
	
	public toggleSidechain(env: Tone.Envelope): void {
		this._sidechainEnvelope = env;
		
		if (this._middlewares.value.find((middleware) => middleware.name === 'AutoDuck')) {
			this.removeMiddleware({
				name: 'AutoDuck',
			})
			this.reconnectMiddlewares()
			return
		}
		
		this.addMiddleware({
			name: 'AutoDuck',
			options: {
				attack: 0,
				decay: 0.1,
				sustain: 0.42,
				release: 0.5,
			}
		})
		this.reconnectMiddlewares()
	}
	
	public setToSource(keyOrObject: string | Object, value?: any): void {
		if (typeof keyOrObject === 'object') {
			const entries = Object.entries(keyOrObject);
			entries.forEach((key, i) => {
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
	
	public setLength(length: number): void {
		this._length.value = length;
		
		const seq = Sequencer.getInstance();
		const trackNumber = seq.soundEngine.tracks.findIndex((t) => t.name === this.name) + 1;
		seq.updatePartLength(trackNumber, length);
	}
}
