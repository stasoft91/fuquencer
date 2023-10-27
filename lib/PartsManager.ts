import {type GridCellArpeggiator, type GridCellModifier, GridCellModifierTypes} from "~/lib/GridCell.types";
import {GridCellNoteModeEnum} from "~/lib/GridCell";
import * as Tone from "tone/Tone";

export type PatternPart = {
	part: Tone.Part<PartEvent>,
	startTime: number,
}

export type PartEvent = {
	time?: any
	notes: string[],
	velocity: number,
	duration: Tone.Unit.Time,
	modifiers: Map<GridCellModifierTypes, GridCellModifier>
	column: number
	row: number
	arpeggiator?: GridCellArpeggiator
	mode?: GridCellNoteModeEnum
}

export class PartsManager {
	private readonly _parts = new Map<string, PatternPart[]>()
	
	public get parts(): PatternPart[] {
		return Array.from(this._parts.values()).flat()
	}
	
	public set(patternId: string, parts: PatternPart[]): void {
		this._parts.set(patternId, parts)
	}
	
	public get(patternId: string): PatternPart[] {
		return this._parts.get(patternId) ?? []
	}
	
	public delete(patternId: string): void {
		this._parts.delete(patternId)
	}
	
	public has(patternId: string): boolean {
		return this._parts.has(patternId)
	}
	
	public at({patternId, partIndex, time, value}: { patternId: string, partIndex: number, time: Tone.Unit.Time, value: PartEvent }): void {
		const part = this.get(patternId)[partIndex]
		
		if (!part) {
			throw new Error(`PartMemory: part of ${patternId} at index ${partIndex} does not exist`)
		}
		
		part.part.at(time, value)
	}
}
