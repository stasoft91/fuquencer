import type {ADSRType, AudioSource} from "~/lib/SoundEngine";
import type {Ref, ShallowRef} from "vue";
import {ref, shallowReactive, shallowRef} from "vue";
import {getEnvelopeOfAudioSource} from "~/lib/utils/getEnvelopeOfAudioSource";
import * as Tone from "tone/Tone";
import type {UniversalEffect} from "~/lib/Effects.types";
import {DEFAULT_SOOTHING} from "@/constants";
import type {LoopParams} from "~/lib/PolyrhythmLoop";
import {PolyrhythmLoop} from "~/lib/PolyrhythmLoop";

export class Track {
	public isSolo: Ref<boolean> = ref(true);
	private _volume: Ref<number>;
	private _type: Ref<string>;
	private _envelope: Ref<ADSRType>;
	private _filterEnvelopeFrequency: Ref<number> = ref(0);
	private _name: Ref<string>;
	
	private _source: AudioSource;
	private _loops: ShallowRef<PolyrhythmLoop[]> = shallowRef([]);
	
	private sidechainSource: Tone.Follower | undefined = undefined;
	
	/** follow kick amplitude to sidechain other channels */
	/** get set in toSidechainSource() */
	private _follower: Tone.Follower | undefined = undefined;
	
	public isMuted: Ref<boolean> = ref(false);

	constructor(params: {name: string, volume: number, source: AudioSource, type: string}) {
		const {name, volume, source, type} = params;
		
		this._name = ref(name);
		this._volume = ref(volume);
		this._source = source;
		this._type = ref(type);
		this._envelope = ref(getEnvelopeOfAudioSource(source));
		
		const sourceSettings = this._source.get();
		this._filterEnvelopeFrequency.value = sourceSettings.filterEnvelope?.baseFrequency as number || 0;
	}
	
	private _middlewares = shallowReactive({value: [] as UniversalEffect[]});
	
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
	
	public set envelope(envelope: ADSRType) {
		this._envelope.value = envelope;
		
		this._source.set({envelope})
		
		this._source.attack = envelope.attack || this._source.attack || 0;
		this._source.release = envelope.release || this._source.release || 0;
	}
	
	public addMiddleware(middleware: UniversalEffect | UniversalEffect[]): void {
		this._middlewares.value = this._middlewares.value.concat(middleware);
		this.reconnectMiddlewares();
	}
	
	public reconnectMiddlewares(): void {
		this._source.disconnect();
		
		this._middlewares.value.map((middleware) => {
			middleware.effect?.dispose();
			middleware.effect = undefined;
			
			if (middleware.name === 'AutoDuck' && this.sidechainSource) {
				middleware.effect = new Tone.Gain(1, "normalRange");
				const scale = new Tone.Scale(1, 0);
				scale.connect(middleware.effect.gain);
				this.sidechainSource.connect(scale);
				
			} else if (middleware.name !== 'AutoDuck') {
				// @ts-ignore
				middleware.effect = new Tone[middleware.name](middleware.options);
				
			} else if (middleware.name === 'AutoDuck' && !this.sidechainSource) {
				console.error('You need to add a sidechain source to use AutoDuck');
				return undefined;
			}
		});
		
		this._follower && this._source.connect(this._follower);
		
		this._source.chain(
			...this._middlewares.value.filter(_ => _).map((middleware) => middleware.effect) as Tone.ToneAudioNode[],
			Tone.Destination
		);
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
	
	public toggleSidechain(follower: Tone.Follower): void {
		this.sidechainSource = follower;
		
		if (this._middlewares.value.find((middleware) => middleware.name === 'AutoDuck')) {
			this.removeMiddleware({
				name: 'AutoDuck',
			})
			this.reconnectMiddlewares()
			return
		}
		
		this.addMiddleware({
			name: 'AutoDuck',
		})
		this.reconnectMiddlewares()
	}
	
	public toSidechainSource(): Tone.Follower {
		this._follower = new Tone.Follower(DEFAULT_SOOTHING); // 0.2 is the smoothing time (in seconds)
		
		this.reconnectMiddlewares()
		
		return this._follower
	}
	
	public setFilterCutoff(value: number): void {
		this._filterEnvelopeFrequency.value = value;
		this._source.set({filterEnvelope: {baseFrequency: value}});
	}
	
	public getLoops() {
		return shallowRef(this._loops);
	}
	
	public addLoop(loop: Omit<LoopParams, 'track' | 'context'>): void {
		this._loops.value = [
			...this._loops.value,
			(new PolyrhythmLoop({...loop, track: this}) as PolyrhythmLoop),
		]
	}
	
	public removeLoop(loop: PolyrhythmLoop): void {
		this._loops.value = this._loops.value.filter((l) => l.name !== loop.name);
	}
}
