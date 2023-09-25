import type {Ref} from "vue";
import {ref} from "vue";

export type HistoryEntry<T> = {
	before: T
	after: T
}

export class HistoryManager<T> {
	private _history: Ref<HistoryEntry<T>[]> = ref([])
	private _index: Ref<number> = ref(-1)
	
	public constructor(
		private readonly maxHistoryLength: number = Infinity
	) {
	}
	
	public get canUndo(): boolean {
		return this._index.value >= 0
	}
	
	public get canRedo(): boolean {
		return this._index.value < this._history.value.length - 1
	}
	
	public get current(): HistoryEntry<T> | null {
		return this._history.value[this._index.value] ?? null
	}
	
	public get length(): number {
		return this._history.value.length
	}
	
	public get currentIndex(): number {
		return this._index.value
	}
	
	public push(before: T, after: T) {
		this._history.value = this._history.value.slice(0, this._index.value + 1)
		
		this._history.value.push({
			before, after
		})
		this._index.value++
		
		// remove history after index if we've gone back in time
		if (this._index.value < this._history.value.length - 1) {
			this._history.value = this._history.value.slice(0, this._index.value)
		}
		
		
		if (this._history.value.length > this.maxHistoryLength) {
			this._history.value.shift()
			this._index.value--
		}
		
		console.log('push', this._history.value)
	}
	
	public clearHistory() {
		this._history.value = []
	}
	
	public undo(): T | null {
		if (this._index.value >= 0) {
			const result = this._history.value[this._index.value].before
			this._index.value--
			return result
		}
		
		return null
	}
	
	public redo(): T | null {
		const result = this._history.value[this._index.value + 1]?.after
		
		if (result && (this._index.value < this._history.value.length - 1)) {
			this._index.value++
			return result
		}
		
		return null
	}
}
