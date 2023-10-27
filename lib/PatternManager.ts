import {type Ref, ref, triggerRef} from "vue";
import {GridCell} from "~/lib/GridCell";
import {GRID_COLS, GRID_ROWS} from "@/constants";

/**
 * PatternManager stores and retrieves Patterns reactively
 */
export class PatternManager {
	private readonly _patternMemory = ref(new Map<string, Pattern>())
	
	public get patterns(): Pattern[] {
		return Array.from(this._patternMemory.value.values())
	}
	
	public get ref(): Ref<Map<string, Pattern>> {
		return this._patternMemory
	}
	
	public byId(patternId: string): Pattern {
		if (!this._patternMemory.value.has(patternId)) {
			throw new Error(`PatternMemory: pattern with id ${patternId} does not exist`)
		}
		
		return this._patternMemory.value.get(patternId)!
	}
	
	public set(pattern: Pattern, id?: string): void {
		this._patternMemory.value.set(id ?? pattern.id, pattern)
	}
	
	public delete(patternId: string): void {
		this._patternMemory.value.delete(patternId)
	}
	
	public clear(): void {
		this._patternMemory.value.clear()
	}
	
	public triggerUpdate(): void {
		triggerRef(this._patternMemory)
	}
	
	public export(): any {
		return Array.from(this._patternMemory.value.values()).map((pattern) => {
			return {
				...pattern,
				cells: pattern.cells.map((cell) => {
					return {
						...cell,
						modifiers: Array.from(cell.modifiers.entries()),
					}
				}),
			}
		})
	}
}

/**
 * A pattern is a collection of GridCells
 */
export class Pattern {
	public cells: GridCell[] = []
	public name: string = ''
	public id: string = ''
	/**
	 * The length of each track in the pattern (count of 1/16th steps per part)
	 */
	public tracksDurationInSteps: number[] = Array(GRID_ROWS).fill(GRID_COLS)
	
	constructor(options: Partial<Pattern>) {
		this.cells = (options as Pattern).cells ?? []
		this.name = (options as Pattern).name ?? Math.random().toString(36).substring(2, 9)
		this.id = (options as Pattern).id ?? Math.random().toString(36).substring(2, 9)
		this.tracksDurationInSteps = (options as Pattern).tracksDurationInSteps ?? Array(GRID_ROWS).fill(GRID_COLS)
	}
}
