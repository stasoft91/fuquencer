import * as Tone from "tone/Tone";
import type {GridCellArpeggiator, GridCellModifier, GridCellOptions} from "~/lib/GridCell.types";
import {GridCellModifierTypes} from "~/lib/GridCell.types";
import {toRaw} from "vue";
import {cloneDeep} from "lodash";

export class GridCell implements GridCellOptions {
	public notes: string[] = []
	public velocity: number = 0
	public row: number = 0
	public column: number = 0
	public duration: Tone.Unit.Time = Tone.Time('16n').toSeconds()
	public modifiers: Map<GridCellModifierTypes, GridCellModifier> = new Map()
	public arpeggiator?: GridCellArpeggiator
	
	constructor(params: Partial<GridCell>) {
        const {
            notes,
            velocity,
            row,
            column,
            duration,
            arpeggiator,
            modifiers
        } = cloneDeep(params)
		
		if (!row || !column) {
			throw new Error('GridCell: row and column are required')
		}
		
		this.notes = toRaw(notes) ?? []
		this.velocity = velocity ?? 0
		this.row = row
		this.column = column
		this.duration = duration ?? Tone.Time('16n').toSeconds()
		
		const rawModifiers = toRaw(modifiers)
		
		this.modifiers = (rawModifiers instanceof Map ? rawModifiers : new Map(rawModifiers)) ?? new Map()
		this.arpeggiator = toRaw(arpeggiator) ?? undefined
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
				return {type, swing: 0, subdivision: Tone.Time('16n').toSeconds() as Tone.Unit.Time}
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
