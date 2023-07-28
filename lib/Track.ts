import type {ADSRType, AudioSource} from "~/lib/SoundEngine";
import type {Ref} from "vue";
import {ref} from "vue";
import {getEnvelopeOfAudioSource} from "~/lib/utils/getEnvelopeOfAudioSource";
import * as Tone from "tone/Tone";
import type {AutoDuck, UniversalEffect} from "~/lib/Effects.types";

export class Track {
	public _name: Ref<string>;
	private _volume: Ref<number>;
	private _type: Ref<string>;
	private _envelope: Ref<ADSRType>;
	
	private _source: AudioSource;
	private _middlewares: UniversalEffect[] = [];
	
	private sidechainSource: Tone.Follower | undefined = undefined;
	
	public isMuted: Ref<boolean> = ref(false);
	public isSolo: Ref<boolean> = ref(false);
	
	public analyser: Tone.Analyser = new Tone.Analyser('waveform', 512*2);
	
	constructor(params: {name: string, volume: number, source: AudioSource, type: string}) {
		const {name, volume, source, type} = params;
		
		this._name = ref(name);
		this._volume = ref(volume);
		this._source = source;
		this._type = ref(type);
		this._envelope = ref(getEnvelopeOfAudioSource(source));
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
	
	public set envelope(envelope: ADSRType) {
		this._envelope.value = envelope;
		
		if (this._source.envelope !== undefined) {
			this._source.envelope.set(envelope)
			return;
		}
		
		this._source.attack = envelope.attack || this._source.attack || 0;
		this._source.release = envelope.release || this._source.release || 0;
	}
	
	public get source(): AudioSource {
		return this._source;
	}
	
	public set source(source: AudioSource) {
		this._source = source;
	}
	
	public get middlewares(): UniversalEffect[] {
		return this._middlewares;
	}
	
	public set middlewares(middlewares: UniversalEffect[]) {
		this._middlewares = middlewares;
	}
	
	public addMiddleware(middleware: UniversalEffect): void {
		this._middlewares = this._middlewares.concat(middleware);
		this.reconnectMiddlewares();
	}
	
	public reconnectMiddlewares(): void {
		this._source.disconnect();
		
		this._middlewares.map((middleware) => {
			middleware.effect?.dispose();
			middleware.mountedId = undefined;
			middleware.effect = undefined;
			
			if (middleware.name === 'AutoDuck' && this.sidechainSource) {
				middleware.effect = new Tone.Gain(1);
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
			
			middleware.mountedId = Math.random().toString(36).substring(7);
		});
		
		this._source.chain(
			...this._middlewares.filter(_=> _).map((middleware) => middleware.effect) as Tone.ToneAudioNode[],
			this.analyser,
			Tone.Destination
		);
	}
	
	public removeMiddleware(middleware: UniversalEffect): void {
		this._middlewares = this._middlewares.filter((m) => m.name !== middleware.name);
		this.reconnectMiddlewares();
	}
	
	public clearMiddlewares(): void {
		this._middlewares = this._middlewares.map((middleware) => {
			middleware.effect?.dispose();
			middleware.mountedId = undefined;
			middleware.effect = undefined;
			return middleware
		});
		
		this._middlewares = []
		
		this.reconnectMiddlewares();
	}
	
	public toggleSidechain(follower: Tone.Follower): void {
		this.sidechainSource = follower;
		
		this.addMiddleware({
			name: 'AutoDuck',
		})
		
		this.reconnectMiddlewares()
	}
	
	public toSidechainSource(): Tone.Follower {
		const follower = new Tone.Follower(0.02); // 0.2 is the smoothing time (in seconds)
		
		this._source.disconnect();
		
		const merge = new Tone.Merge();
		merge.connect(Tone.Destination,0, 0);
		merge.connect(follower,0, 0);
		
		this._source.fan(follower, Tone.Destination);
		
		return follower
	}
}
