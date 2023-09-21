import type {Ref} from "vue";
import {ref} from "vue";
import * as Tone from "tone/Tone";

export type LFOType = Tone.ToneOscillatorType | 'random' | 'oneshot'

export type AutomatableParam = Tone.Signal<any> | Tone.Param<any>;

export interface LFOOptions {
	type: LFOType,
	frequency: number,
	min: number,
	max: number,
	phase?: number,
	destination: AutomatableParam,
	title?: string
}

export class LFO {
	public readonly title: string = ''
	private _lfo!: Tone.LFO | Tone.ToneEvent | Tone.Loop
	private readonly _destination: AutomatableParam
	
	constructor(options: LFOOptions) {
		const {type, frequency, min, max, phase, destination} = options;
		
		this._id = Math.random().toString(36).substring(2, 9)
		this._type.value = type
		this._frequency.value = frequency
		this._min.value = min
		this._max.value = max
		this._phase.value = phase ?? 0
		this._destination = destination
		this.title = options.title ?? ''
		
		this.setLfo();
	}
	
	private readonly _id: string
	
	public get id(): string {
		return this._id
	}
	
	private _type: Ref<LFOType> = ref('sine')
	
	public get type(): LFOType {
		return this._type.value
	}
	
	public set type(type: LFOType) {
		this.setOptions({
			type
		})
	}
	
	private _frequency: Ref<number> = ref(1)
	
	public get frequency(): number {
		return this._frequency.value
	}
	
	public set frequency(frequency: number) {
		this.setOptions({
			frequency
		})
	}
	
	private _min: Ref<number> = ref(0)
	
	public get min(): number {
		return this._min.value
	}
	
	public set min(min: number) {
		this.setOptions({
			min
		})
	}
	
	private _max: Ref<number> = ref(1)
	
	public get max(): number {
		return this._max.value
	}
	
	public set max(max: number) {
		this.setOptions({
			max
		})
	}
	
	private _phase: Ref<number> = ref(0)
	
	public get phase(): number {
		return this._phase.value
	}
	
	private _isRunning: Ref<boolean> = ref(false)
	
	public get isRunning(): boolean {
		return this._isRunning.value
	}
	
	public set isRunning(value: boolean) {
		this._isRunning.value = value
	}
	
	public get destination(): AutomatableParam {
		return this._destination
	}
	
	public setOptions(options: Partial<LFOOptions>): void {
		this._type.value = options.type ?? this._type.value
		this._frequency.value = options.frequency ?? this._frequency.value
		this._min.value = options.min ?? this._min.value
		this._max.value = options.max ?? this._max.value
		
		if (this._type.value === 'oneshot') {
			this.isRunning = false;
		}
		
		if (
			this._lfo instanceof Tone.LFO &&
			this._type.value !== 'random' &&
			this._type.value !== 'oneshot'
		) {
			this._lfo.set({
				frequency: Tone.Time(this._frequency.value, 'hz').toFrequency(),
				phase: 0,
				min: this._min.value,
				max: this._max.value,
				type: this._type.value as Tone.ToneOscillatorType,
			})
		} else if (this._type.value === 'random') {
			// @ts-ignore
			this._lfo.set({interval: Tone.Time(this._frequency.value, 'hz')})
			
			if (options.type || options.min || options.max) {
				this.setLfo();
				if (this.isRunning) {
					this._lfo.start('+0.01')
				}
			}
		} else {
			this.setLfo();
		}
	}
	
	public start(atTime: Tone.Unit.Time): void {
		new Tone.ToneEvent(() => {
			this.isRunning = true
			
			if (this._type.value === 'oneshot') {
				const endTime = Tone.Time(atTime).toSeconds() + Tone.Time(this._frequency.value, 'hz').toSeconds()
				
				new Tone.ToneEvent(() => {
					this.isRunning = false
				}).start(endTime)
			}
		}).start(atTime)
		
		this._lfo.start(atTime)
	}
	
	public stop(atTime: Tone.Unit.Time): void {
		new Tone.ToneEvent(() => {
			this.isRunning = false
		}).start(atTime)
		
		this._lfo.stop(atTime)
	}
	
	private setLfo(): void {
		// By default, the filter is overridden by the filter envelope,
		// we need to disable that to control the filter frequency with our own LFO
		// eslint-disable-next-line vue/no-mutating-props
		this._destination.overridden = false;
		this._lfo?.dispose();
		
		if (this._type.value === 'random') {
			this._lfo = new Tone.Loop((time) => {
				const randomValue = Math.random() * (this._max.value - this._min.value) + this._min.value
				
				this._destination.cancelScheduledValues(time - 0.001)
				this._destination.rampTo(randomValue, 0.001, time)
			});
			
			// @ts-ignore
			this._lfo.set({interval: Tone.Time(this._frequency.value, 'hz')})
			
		} else if (this._type.value === 'oneshot') {
			this._lfo = new Tone.Loop((time) => {
				this._destination.cancelScheduledValues(time - 0.01)
				this._destination.exponentialRampTo(this._min.value, 0.001, time - 0.001)
				this._destination.exponentialRampTo(this._max.value, Tone.Time(this._frequency.value, 'hz') as Tone.Unit.Time, time)
				
				this._lfo.stop(time + Tone.Time(this._frequency.value, 'hz').toSeconds())
			});
			
			this._lfo.iterations = 1;
			
		} else {
			this._lfo = new Tone.LFO({
				frequency: this._frequency.value,
				min: this._min.value,
				max: this._max.value,
				type: this._type.value as Tone.ToneOscillatorType,
				phase: this._phase.value,
			})
			this._lfo.connect(this._destination)
		}
	}
}
