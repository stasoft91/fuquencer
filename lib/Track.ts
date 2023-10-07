import {SOURCE_TYPES} from "~/lib/SoundEngine";
import type {Ref, ShallowRef} from "vue";
import {ref, shallowReactive, shallowRef} from "vue";
import * as Tone from "tone/Tone";
import type {UniversalEffect} from "~/lib/Effects.types";
import type {LoopOptions} from "~/lib/PolyrhythmLoop";
import {PolyrhythmLoop} from "~/lib/PolyrhythmLoop";
import {DEFAULT_NOTE, Sequencer} from "~/lib/Sequencer";
import type {AbstractSourceOptions} from "~/lib/sources/LegacySource";
import DistortionModule from "~/lib/sound-components/DistortionModule/DistortionModule"
import {type RNBOSourceOptions} from "~/lib/sources/RNBOSource";
import {createNewSource, type SourceType} from "~/lib/utils/createNewSource";
import type {VoiceType} from "~/lib/rnbo/data";
import type {SoundfontOptions} from "smplr";

export type TrackOptions = {
    name: string,
    source: SourceType,
    sourceType: SOURCE_TYPES,
}

export type TrackExportOptions = Omit<TrackOptions, 'source'> & {
    sourceType: SOURCE_TYPES,
    source: RNBOSourceOptions | AbstractSourceOptions | SoundfontOptions,
    middlewares: UniversalEffect[],
    length: number,
    loops: Omit<LoopOptions, 'track'>[],
}

export class Track {
    public channel: Tone.Channel = new Tone.Channel();
    public sourceType: Ref<SOURCE_TYPES> = ref(SOURCE_TYPES.legacyMono);
    public isSourceInitialized: Ref<boolean> = ref(false);
    private _loops: ShallowRef<PolyrhythmLoop[]> = shallowRef([]);

    constructor(params: TrackOptions) {
        const {name, source, sourceType} = params;

        this._name = ref(name);
        this._source = source;
        this.sourceType.value = sourceType;

        this.reconnectMiddlewares();
    }

    private _name: Ref<string>;

    public get name(): string {
        return this._name.value;
    }

    public set name(value: string) {
        this._name.value = value;
    }

    private _sidechainEnvelope: Tone.Envelope | undefined = undefined;

    public get sidechainEnvelope(): Tone.Envelope | undefined {
        return this._sidechainEnvelope;
    }

    private _middlewares = shallowReactive({value: [] as UniversalEffect[]});
    
    public get middlewares(): UniversalEffect[] {
        return this._middlewares.value;
    }
    
    private _length: Ref<number> = ref(16);
    
    /*
     * Starts with 1
     */
    public get length(): number {
        return this._length.value;
    }
    
    private _meta: Ref<Map<string, any>> = ref(new Map());
    
    /**
     * Map of all the properties of the track (reactive)
     * @returns {Map<string, any>}
     */
    public get meta(): Map<string, any> {
        if (this._meta.value.size === 0) {
            const keys = new Set([
                ...Object.keys(this._source.get()),
            ]);
            const meta = new Map<string, string>();
            const originalOptions = this._source.get();
            
            keys.forEach((key) => {
                meta.set(key, Object.entries(originalOptions).find(([k]) => k === key)?.[1] as string);
            });
            
            this._meta.value = meta;
        }
        return this._meta.value;
    }
    
    private _source: SourceType;
    
    public get source(): SourceType {
        return this._source;
    }
    
    public static async importFrom(trackOptions: TrackExportOptions): Promise<Track> {
        const source = createNewSource(trackOptions)
        
        await source.init();
        
        const newTrack = new Track({
            name: trackOptions.name,
            source,
            sourceType: trackOptions.sourceType,
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
    
    public addMiddleware(middleware: UniversalEffect | UniversalEffect[]): void {
        this._middlewares.value = this._middlewares.value.concat(middleware);
        this.reconnectMiddlewares();
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
    
    public getLoops() {
        return shallowRef(this._loops);
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
                
                const scale = new Tone.Scale(0, -0.9);
                scale.connect(effect.volume);
                
                this._sidechainEnvelope.set(middleware.options as Tone.EnvelopeOptions);
                this._sidechainEnvelope?.connect(scale);
                
                middleware.effect = effect;
                
            } else if (middleware.name !== 'AutoDuck') {
                // CUSTOM LOGIC ON DISTORTION (distortion type)
                if (middleware.name === 'Distortion') {
                    middleware.effect = new DistortionModule({...middleware.options});
                } else {
                    // EFFECT IS ANY OTHER EFFECT
                    // @ts-ignore
                    middleware.effect = new Tone[middleware.name](middleware.options);
                }
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

    public setToSource(keyOrObject: string | Object, value?: any, time: number = 0): void {
        if (time === 0) {
            // TODO precise timing?? or we just use 0??
            time = Tone.now() + 0.1;
        }
        
        const set = (keyOrObject: string, value: string, time?: number) => {
            if (this._source.AVAILABLE_SETTINGS.includes(keyOrObject as string)) {
                this._source.set({[keyOrObject]: value}, time);
                this._meta.value.set(keyOrObject, value);
            }
        }
        
        if (typeof keyOrObject === 'object') {
            const entries = Object.entries(keyOrObject);
            entries.forEach((key) => {
                set(key[0], key[1], time)
            });
        } else {
            set(keyOrObject, value, time)
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
            source: this.source.export(),
            middlewares: this.middlewares.map(_ => ({
                name: _.name,
                options: {..._.options, ..._.effect.get()},
                effect: undefined,
            })) as UniversalEffect[],
            length: this.length,
            loops: this._loops.value.map((loop) => ({
                ...loop.export()
            })),
            sourceType: this.sourceType.value
        }
    }
    
    public setLength(length: number): void {
        this._length.value = length;
        
        const seq = Sequencer.getInstance();
        const trackNumber = seq.soundEngine.tracks.value.findIndex((t) => t.name === this.name) + 1;
        seq.updatePartDuration(trackNumber, length);
    }
    
    public async setTrackType(type: SOURCE_TYPES, subtype?: string): Promise<void> {
        this.isSourceInitialized.value = false;
        this.sourceType.value = type;
        let source: TrackExportOptions['source'];
        
        switch (type) {
            case SOURCE_TYPES.legacyMono:
                source = {
                    synth: {
                        oscillator: {
                            type: 'pulse'
                        },
                        envelope: {
                            attack: 0.01,
                            decay: 0.42,
                            sustain: 0.01,
                            release: 0.25
                        },
                        filterEnvelope: {
                            attack: 0.001,
                            decay: 0.1,
                            sustain: 0.5,
                        },
                        volume: -6
                    }
                } as AbstractSourceOptions
                break;
            case SOURCE_TYPES.sampler:
                source = {
                    sampler: {
                        urls: {
                            [DEFAULT_NOTE]: subtype ?? 'kick.wav'
                        }
                    }
                }
                break;
            
            case SOURCE_TYPES.SMPLR_Instrument:
                source = {
                    instrument: subtype ?? "acoustic_grand_piano"
                } as SoundfontOptions
                break;
            
            case SOURCE_TYPES.SMPLR_Drum:
                source = {
                    instrument: subtype ?? "TR-808"
                } as SoundfontOptions
                break;
            
            default:
                source = {voiceType: type as VoiceType} as RNBOSourceOptions
                break;
            
        }
        
        try {
            this._source = createNewSource({
                sourceType: type,
                source
            });

            await this._source.init();
            this.isSourceInitialized.value = true;
            this.reconnectMiddlewares();
        } catch (e) {
            console.error(e);
        }
    }
}
