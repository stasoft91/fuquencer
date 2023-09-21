import * as Tone from "tone/Tone";
import type {PatternName} from "~/lib/PatternGenerator";
import {DEFAULT_NOTE} from "~/lib/Sequencer";

export interface GridCellArpeggiator {
	pulses: number,
	parts: number,
	shift: number,
	type: PatternName,
	gate: Tone.Unit.Time,
}

export interface GridCellOptions {
	id: string
	notes: string[]
	velocity: number
	row: number
	column: number
	duration: Tone.Unit.Time
	modifiers: Map<GridCellModifierTypes, GridCellModifier>
	arpeggiator?: GridCellArpeggiator
}

export enum GridCellModifierTypes {
	swing = 'swing',
	flam = 'flam', // number of times the note is repeated
	probability = 'probability', // probability of the note being played
	skip = 'skip',
	slide = 'slide', // portamento of monophonic
	
	// reverse = 'reverse', // TODO: research if possible
	// arpeggiator = 'arpeggiator', // TODO: research if possible
	// instrumentSpecific = 'instrumentSpecific' //TODO: research if possible
}

export type GridCellModifier = SwingParams | FlamParams | ProbabilityParams | SkipParams | SlideParams

export type SwingParams = {
	type: GridCellModifierTypes.swing
	
	/**
	 * Amount of swing (0-100)
	 */
	swing: number
	
	/**
	 * Subdivision of the swing to align to
	 */
	subdivision: Tone.Unit.Time
}

export type FlamParams = {
	type: GridCellModifierTypes.flam
	
	/**
	 * Number of times the note is repeated (1-8)
	 */
	roll: number
	
	/**
	 * Velocity of the repeated notes (0-1)
	 */
	velocity?: number
	
	/**
	 * will make flam increase velocity of repeated notes from increaseVelocityFrom to velocity
	 * (0-1)
	 */
	increaseVelocityFrom?: number
}

export type ProbabilityParams = {
	type: GridCellModifierTypes.probability
	
	/**
	 * Probability of the note being played (0-100)
	 */
	probability: number
}

export type SkipParams = {
	type: GridCellModifierTypes.skip
	
	/**
	 * How often the step is actually triggered
	 * - 1 = every time
	 * - 2 = every other time
	 * - 3 = every third time
	 * - etc.
	 *
	 * (1-16)
	 */
	skip: number
	
	/**
	 * Times the step was poked since the last actual trigger
	 */
	timesTriggered?: number
}

export type SlideParams = {
	type: GridCellModifierTypes.slide
	
	/**
	 * Portamento (in milliseconds)
	 */
	slide: number
}

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
}
