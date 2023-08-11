import {Track} from "~/lib/Track";
import * as Tone from "tone/Tone";
import type {Ref} from "vue";
import {ref} from "vue";
import {getToneTimeNextMeasure} from "~/lib/utils/getToneTimeNextMeasure";

export type LoopParams = {
	track: Track,
	note?: Tone.Unit.Frequency,
	duration?: Tone.Unit.Time,
	interval?: Tone.Unit.Time
} & Partial<Tone.LoopOptions>

export class PolyrhythmLoop {
	public name!: string;
	private _loop: Tone.Loop = new Tone.Loop();

	public constructor(params: LoopParams) {
		this.name = Math.random().toString(36).substring(2, 9);
		
		this._note = ref(params.note ? params.note : "C4");
		this._duration = ref(params.duration ? params.duration : "8n");
		this._interval = ref(params.interval ? params.interval : "2n.");
		this._track = params.track
		this._humanize.value = params.humanize ?? false
		this._probability.value = params.probability || 1
		
		this.set({
			duration: this._duration.value,
			interval: this._interval.value,
			humanize: this._humanize.value,
			note: this._note.value,
			probability: this._probability.value,
			
			callback: (time) => {
				this._track.source.triggerAttackRelease(this._note.value, this._duration.value, time);
			},
		})
	}

	private _track!: Track;

	public get track(): Track {
		return this._track;
	}

	private _note!: Ref<Tone.Unit.Frequency>;

	public get note(): Tone.Unit.Frequency {
		return this._note.value;
	}

	private _duration!: Ref<Tone.Unit.Time>;

	public get duration(): Tone.Unit.Time {
		return this._duration.value;
	}
	
	private _interval!: Ref<Tone.Unit.Time>;
	
	public get interval(): Tone.Unit.Time {
		return this._interval.value;
	}
	
	private _isRunning: Ref<boolean> = ref(false);
	
	public get isRunning(): boolean {
		return this._isRunning.value;
	}
	
	private _humanize: Ref<boolean | Tone.Unit.Time> = ref(false);
	
	public get humanize(): boolean | Tone.Unit.Time {
		return this._humanize.value;
	}
	
	private _probability: Ref<number> = ref(1);
	
	public get probability(): number {
		return this._probability.value;
	}
	
	public stop(time?: Tone.Unit.Time): void {
		this._loop?.stop(time)
		this._isRunning.value = false
	}
	
	public start(time?: Tone.Unit.Time): void {
		this._loop?.start(time)
		this._isRunning.value = true
	}
	
	public set(params: Omit<LoopParams, 'track'>): void {
		this._note.value = params.note ? params.note : this._note.value;
		this._duration.value = params.duration ? params.duration : this._duration.value;
		this._interval.value = params.interval ? params.interval : this._interval.value;
		this._humanize.value = params.humanize ? params.humanize : this._humanize.value;
		this._probability.value = params.probability ? params.probability : this._probability.value;
		
		// const newLoop = new Tone.Loop((time) => {
		// 	this._track.source.triggerAttackRelease(this._note.value, this._duration.value, Tone.Time(time).quantize(this._interval.value));
		// }, this._interval.value)
		
		this._loop?.stop(getToneTimeNextMeasure());
		
		// после глобальной старт\стопа перестают работать лупы
		// ставим на то что счетчик у глобал транспорта смывается
		this._loop.set({
			interval: this._interval.value,
			callback: (time: Tone.Unit.Time) => {
				if (this.probability < Math.random()) {
					return;
				}
				
				this._track.source.releaseAll().triggerAttackRelease(this._note.value, this._duration.value, time);
			},
			humanize: this._humanize.value,
		})
		
		if (this._isRunning.value) {
			this._loop.start(getToneTimeNextMeasure());
		}
	}
	
	public remove(): void {
		this._track.removeLoop(this)
		this._loop?.dispose()
	}
}

