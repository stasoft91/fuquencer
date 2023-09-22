import * as Tone from "tone/Tone";
import {DEFAULT_NOTE} from "~/lib/Sequencer";
import type {GridCellArpeggiator, GridCellModifier, GridCellOptions} from "~/lib/GridCell.types";
import {GridCellModifierTypes} from "~/lib/GridCell.types";

export class GridCell implements GridCellOptions {
	public notes: string[] = [DEFAULT_NOTE]
	public velocity: number = 0
	public row: number = 0
	public column: number = 0
	public duration: Tone.Unit.Time = Tone.Time('16n') as Tone.Unit.Time
	public modifiers: Map<GridCellModifierTypes, GridCellModifier> = new Map()
	public arpeggiator?: GridCellArpeggiator
	
	constructor(params: Partial<GridCell>) {
		const {notes, velocity, row, column, duration, arpeggiator} = params
		
		if (!row || !column) {
			throw new Error('GridCell: row and column are required')
		}
		
		this.notes = notes ?? [DEFAULT_NOTE]
		this.velocity = velocity ?? 0
		this.row = row
		this.column = column
		this.duration = duration ?? Tone.Time('16n') as Tone.Unit.Time
		this.modifiers = params.modifiers ?? new Map()
		this.arpeggiator = arpeggiator ?? undefined
	}
	
	public get id(): string {
		return `${this.row}-${this.column}`
	}
	
	public set id(id: string) {
		const [row, column] = id.split('-')
		
		this.row = parseInt(row)
		this.column = parseInt(column)
	}
	
	public hasModifier(type: GridCellModifierTypes): boolean {
		return this.modifiers.has(type)
	}
	
	static getDefaultValueForModifier(type: GridCellModifierTypes): GridCellModifier {
		switch (type) {
			case GridCellModifierTypes.swing:
				return {type, swing: 0, subdivision: Tone.Time('16n') as Tone.Unit.Time}
			case GridCellModifierTypes.flam:
				return {type, roll: 1, velocity: 1, increaseVelocityFrom: 0.5}
			case GridCellModifierTypes.probability:
				return {type, probability: 100}
			case GridCellModifierTypes.skip:
				return {type, skip: 1, timesTriggered: 0}
			case GridCellModifierTypes.slide:
				return {type, slide: 0}
		}
	}
}
