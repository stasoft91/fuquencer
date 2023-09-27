import {Sequencer} from "~/lib/Sequencer";
import type {Track} from "~/lib/Track";
import {ref} from "vue";
import {GridCell} from "~/lib/GridCell";

export const keyboardMapNotes: Record<string, string> = {
	'z': 'C4',
	's': 'C#4',
	'x': 'D4',
	'd': 'D#4',
	'c': 'E4',
	'v': 'F4',
	'g': 'F#4',
	'b': 'G4',
	'h': 'G#4',
	'n': 'A4',
	'j': 'A#4',
	'm': 'B4',
	',': 'C5',
	'l': 'C#5',
	'.': 'D5',
	';': 'D#5',
	'/': 'E5',
	'q': 'C5',
	'2': 'C#5',
	'w': 'D5',
	'3': 'D#5',
	'e': 'E5',
	'r': 'F5',
	'5': 'F#5',
	't': 'G5',
	'6': 'G#5',
	'y': 'A5',
	'7': 'A#5',
	'u': 'B5',
	'i': 'C6',
	'9': 'C#6',
	'o': 'D6',
	'0': 'D#6',
	'p': 'E6',
	'[': 'F6',
	'=': 'F#6',
	']': 'G6',
	'\\': 'G#6',
}

export class KeyboardManager {
	private static instance: KeyboardManager;
	private _track: Track | null = null;
	
	private constructor() {
	}

	private _isAudible = ref(false);
	private _isRecording = ref(false);

	public get isAudible(): boolean {
		return this._isAudible.value;
	}
	
	public set isAudible(value: boolean) {
		this._isAudible.value = value;
	}

	
	public get isRecording(): boolean {
		return this._isRecording.value;
	}
	
	public set isRecording(value: boolean) {
		this._isRecording.value = value;
	}
	
	public static getInstance(): KeyboardManager {
		if (!KeyboardManager.instance) {
			KeyboardManager.instance = new KeyboardManager();
		}
		
		return KeyboardManager.instance;
	}
	
	public unregisterEvents() {
		this._track = null;
		
		document.removeEventListener("keydown", this.keydownHandler);
		
		document.removeEventListener("keyup", this.keyupHandler);
	}
	
	public registerEvents(track: Track) {
		this._track = track;
		
		this.keydownHandler = this.sourceTriggerAttack.bind(this)
		this.keyupHandler = this.sourceTriggerRelease.bind(this)
		
		document.addEventListener("keydown", this.keydownHandler);
		
		document.addEventListener("keyup", this.keyupHandler);
	}
	
	private keydownHandler: (e: KeyboardEvent) => void = () => {
	}
	
	private keyupHandler: (e: KeyboardEvent) => void = () => {
	}
	
	private sourceTriggerAttack(e: KeyboardEvent) {
		if (!this.isAudible) {
			return;
		}
		
		const note = keyboardMapNotes[e.key.toLowerCase()];
		
		if (!note) {
			return;
		}
		
		const isShiftPressed = e.key === e.key.toUpperCase();
		let velocity = 0.85
		
		if (isShiftPressed) {
			velocity = 1
		}
		
		if (this._isAudible.value) {
			this._track?.source?.triggerAttack(note, undefined, velocity);
		}
		
		if (this._isRecording.value) {
			const seq = Sequencer.getInstance()
			
			seq.writeCell(new GridCell({
				column: seq.currentStep,
				row: seq.soundEngine.tracks.value.findIndex((t) => t.name === this._track?.name) + 1,
				velocity: velocity * 100,
				notes: [note],
			}))
		}
	}
	
	private sourceTriggerRelease(e: KeyboardEvent) {
		if (!this.isAudible) {
			return;
		}
		
		const note = keyboardMapNotes[e.key];
		
		if (!note) {
			return;
		}
		
		this._track?.source?.triggerRelease(note);
	}
}
