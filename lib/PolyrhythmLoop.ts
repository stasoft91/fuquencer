import {Track} from "~/lib/Track";
import * as Tone from "tone/Tone";
import type {Ref} from "vue";
import {ref} from "vue";
import {getToneTimeNextMeasure} from "~/lib/utils/getToneTimeNextMeasure";

export type LoopParams = {
	track: Track,
	note?: Tone.Unit.Frequency,
	duration?: Tone.Unit.Time,
	interval?: Tone.Unit.Time,
	isAutomation?: boolean,
} & Partial<Tone.LoopOptions>

export class PolyrhythmLoop {
	public isAutomation: Ref<boolean>;
	public name!: string;
	private _loop: Tone.Loop = new Tone.Loop();
	private _callback: (time: number) => void;
	private _track!: Track;
	private _note!: Ref<Tone.Unit.Frequency>;
	private _duration!: Ref<Tone.Unit.Time>;
	private _interval!: Ref<Tone.Unit.Time>;
	private _isRunning: Ref<boolean> = ref(false);
	private _humanize: Ref<boolean | Tone.Unit.Time> = ref(false);
	private _probability: Ref<number> = ref(1);
	
	public constructor(params: LoopParams) {
		this.name = Math.random().toString(36).substring(2, 9);
		this.isAutomation = ref(params.isAutomation ?? false);
		
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
		})
		this._callback = params.callback || this.defaultCallback.bind(this)
		this.set({
			callback: this._callback
		})
	}
	
	public get track(): Track {
		return this._track;
	}



	public get note(): Tone.Unit.Frequency {
		return this._note.value;
	}


	public get duration(): Tone.Unit.Time {
		return this._duration.value;
	}
	
	public get interval(): Tone.Unit.Time {
		return this._interval.value;
	}
	
	public get isRunning(): boolean {
		return this._isRunning.value;
	}
	
	public get humanize(): boolean | Tone.Unit.Time {
		return this._humanize.value;
	}
	
	public get probability(): number {
		return this._probability.value;
	}
	
	public stop(time?: Tone.Unit.Time): void {
		this._loop?.stop(time)
		this._isRunning.value = false
	}
	
	public start(time?: Tone.Unit.Time): PolyrhythmLoop {
		this._loop?.start(time)
		this._isRunning.value = true
		
		return this
	}
	
	public set(params: Omit<LoopParams, 'track'>): PolyrhythmLoop {
		this._note.value = params.note ? params.note : this._note.value;
		this._duration.value = params.duration ? params.duration : this._duration.value;
		this._interval.value = params.interval ? params.interval : this._interval.value;
		this._humanize.value = params.humanize ? params.humanize : this._humanize.value;
		this._probability.value = params.probability ? params.probability : this._probability.value;
		
		this._callback = params.callback || this._callback || this.defaultCallback.bind(this)
		
		this._loop?.stop(getToneTimeNextMeasure());
		
		this._loop.set({
			interval: this._interval.value,
			callback: this._callback,
			humanize: this._humanize.value,
		})
		
		if (this._isRunning.value) {
			this._loop.start(getToneTimeNextMeasure());
		}
		
		return this;
	}
	
	public remove(): void {
		this._track.removeLoop(this)
		this._loop?.dispose()
	}
	
	private defaultCallback(time: Tone.Unit.Time): void {
		if (this.probability < Math.random()) {
			return;
		}
		
		this._track.source.releaseAll().triggerAttackRelease(this._note.value, this._duration.value, time);
	}
}

