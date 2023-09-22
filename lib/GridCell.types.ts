import type {PatternName} from "~/lib/PatternGenerator";
import * as Tone from "tone/Tone";

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
	// instrumentSpecific = 'instrumentSpecific' // TODO: research if possible
}

export type GridCellModifier = (SwingParams | FlamParams | ProbabilityParams | SkipParams | SlideParams) & {
	swing?: number
	subdivision?: Tone.Unit.Time
	roll?: number
	velocity?: number
	increaseVelocityFrom?: number
	probability?: number
	skip?: number
	timesTriggered?: number
	slide?: number
}

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
