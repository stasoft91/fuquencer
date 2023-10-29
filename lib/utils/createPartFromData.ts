import * as Tone from "tone/Tone";

import {
	type FlamParams,
	GridCellModifierTypes,
	type ProbabilityParams,
	type SkipParams,
	type SlideParams,
	type SwingParams
} from "~/lib/GridCell.types";
import {cloneDeep} from "lodash";
import {GridCell, GridCellNoteModeEnum} from "~/lib/GridCell";
import {createEuclideanRhythmVector} from "~/lib/utils/createEuclideanRhythmVector";
import {PatternGenerator} from "~/lib/PatternGenerator";
import {getBarsBeatsSixteensFromStep} from "~/lib/utils/getBarsBeatsSixteensFromStep";
import {stepsToLoopLength} from "~/lib/utils/stepsToLoopLength";
import type {Track} from "~/lib/Track";
import {Sequencer} from "~/lib/Sequencer";
import type {PartEvent} from "~/lib/PartsManager";

export type PartFromDataOptions = {
	track: Track,
	trackIndex: number,
	trackData: GridCell[],
	patternId: string,
	lengthInSteps: number,
}

export function createPartFromData(options: PartFromDataOptions): Tone.Part {
	const {track, trackIndex, trackData, patternId, lengthInSteps} = options
	const sequencer = Sequencer.getInstance()
	
	return new Tone.Part(
		((time, partEvent: PartEvent) => {
			if (partEvent.velocity === 0) {
				return
			}
			
			// TODO Why do we suppose the very first channel to always be (only) sidechain source (kick)?..
			if (trackIndex === 0 && !track.meta.get('mute')) {
				track.sidechainEnvelope?.triggerAttackRelease(partEvent.duration, time)
			}
			
			// new Promise(() => console.log('PART', i, partEvent.notes, partEvent.velocity, partEvent.duration, Tone.Time(time).toBarsBeatsSixteenths(), partEvent.modifiers, partEvent.arpeggiator))
			
			const hasArpEnabled = partEvent.arpeggiator && partEvent.notes.length > 1
			
			// Probability
			// Works differently with Arps (see Arp section)
			if (partEvent.modifiers.has(GridCellModifierTypes.probability) && !hasArpEnabled) {
				const probabilityParams = partEvent.modifiers.get(GridCellModifierTypes.probability) as ProbabilityParams
				
				if (Math.random() * 100 > probabilityParams.probability) {
					return
				}
			}
			
			const cell = sequencer.readCell(partEvent.row, partEvent.column, patternId)
			const modifiers = new Map(cloneDeep(cell.modifiers))
			
			if (partEvent.modifiers.has(GridCellModifierTypes.skip)) {
				const skipParams = partEvent.modifiers.get(GridCellModifierTypes.skip) as SkipParams
				
				modifiers.set(GridCellModifierTypes.skip, {
					type: GridCellModifierTypes.skip,
					skip: skipParams.skip,
					timesTriggered: skipParams.timesTriggered ? skipParams.timesTriggered + 1 : 1,
				})
				
				let newGridCell = new GridCell({
					...cell,
					modifiers,
				})
				sequencer.writeCell(newGridCell, {ignoreHistory: true, patternId})
				
				const skipParamsForCell = modifiers.get(GridCellModifierTypes.skip) as SkipParams
				
				if (skipParamsForCell.timesTriggered && skipParamsForCell.timesTriggered % skipParams.skip !== 0) {
					return
				} else {
					modifiers.set(GridCellModifierTypes.skip, {
						type: GridCellModifierTypes.skip,
						skip: skipParams.skip,
						timesTriggered: 0,
					})
				}
				
				newGridCell = new GridCell({
					...cell,
					modifiers,
				})
				sequencer.writeCell(newGridCell, {ignoreHistory: true, patternId})
			}
			
			if (partEvent.modifiers.has(GridCellModifierTypes.swing)) {
				const swingParams = partEvent.modifiers.get(GridCellModifierTypes.swing) as SwingParams
				
				time = Tone.Time(time).quantize(swingParams.subdivision, swingParams.swing / 100)
			}
			
			const flamParams = partEvent.modifiers.get(GridCellModifierTypes.flam) as FlamParams | undefined
			
			if (partEvent.modifiers.has(GridCellModifierTypes.flam) && flamParams && flamParams.roll > 1) {
				const timeOfOneFullNote = Tone.Time(partEvent.duration).toSeconds()
				const timeOfOneFlamNote = timeOfOneFullNote / flamParams.roll
				
				for (let i = 0; i < flamParams.roll; i++) {
					track.source.releaseAll(time)
					
					let velocity = flamParams.velocity ?? (partEvent.velocity)
					
					if (flamParams.increaseVelocityFrom) {
						velocity = flamParams.increaseVelocityFrom + (velocity - flamParams.increaseVelocityFrom) * (i / flamParams.roll)
					}
					
					let note: string;
					if (partEvent.notes.length > 1) {
						// map roll count to note of pattern
						const noteIndex = Math.floor(i / flamParams.roll * partEvent.notes.length)
						note = partEvent.notes[noteIndex]
					} else {
						note = partEvent.notes[0]
					}
					
					track.source.triggerAttackRelease(
						note,
						partEvent.duration,
						time,
						velocity
					)
					time += timeOfOneFlamNote
					
				}
				
				return
			}
			
			if (partEvent.modifiers.has(GridCellModifierTypes.playbackRate)) {
				const playbackRateParams = partEvent.modifiers.get(GridCellModifierTypes.playbackRate)
				
				track.setToSource({playbackRate: playbackRateParams!.playbackRate})
			} else {
				track.setToSource({playbackRate: 1})
			}
			
			if (partEvent.modifiers.has(GridCellModifierTypes.reverse)) {
				track.setToSource({reverse: true})
			} else {
				track.setToSource({reverse: false})
			}
			
			// ARP SECTION
			if (partEvent.notes.length > 1 && partEvent.arpeggiator && partEvent.mode === GridCellNoteModeEnum.arpeggio) {
				const {pulses, parts, shift, type, gate} = partEvent.arpeggiator
				
				const shiftedEuclideanRhythmVector = createEuclideanRhythmVector(pulses, parts, shift)
				
				const timeOfOneRhythmPart = Tone.Time(partEvent.duration).toSeconds() / shiftedEuclideanRhythmVector.length
				
				let arpMicroTime = -timeOfOneRhythmPart
				
				const patternNoteIndex = PatternGenerator(partEvent.notes.length, type)
				
				shiftedEuclideanRhythmVector.forEach((hasPulse) => {
					arpMicroTime += timeOfOneRhythmPart
					
					if (!hasPulse) {
						return
					}
					
					if (partEvent.modifiers.has(GridCellModifierTypes.probability)) {
						const probabilityParams = partEvent.modifiers.get(GridCellModifierTypes.probability) as ProbabilityParams
						
						if (Math.random() * 100 > probabilityParams.probability) {
							return
						}
					}
					
					track.source.triggerAttackRelease(
						partEvent.notes[patternNoteIndex.next().value],
						gate,
						time + arpMicroTime,
						partEvent.velocity
					)
				})
			} else {
				let notes = cloneDeep(partEvent.notes)
				if (partEvent.modifiers.has(GridCellModifierTypes.octaveShift)) {
					const octaveShiftParams = partEvent.modifiers.get(GridCellModifierTypes.octaveShift)
					
					if (octaveShiftParams?.octaveShiftProbability && octaveShiftParams.octaveShiftAmount && Math.random() * 100 < octaveShiftParams.octaveShiftProbability) {
						notes = partEvent.notes.map((note) => {
							const transposeAmount = (Math.random() > 0.5 ? octaveShiftParams.octaveShiftAmount : -octaveShiftParams.octaveShiftAmount!) ?? 0
							
							return Tone.Frequency(note).transpose(transposeAmount).toNote()
						})
					}
				}
				
				// DEFAULT section
				try {
					if (partEvent.modifiers.has(GridCellModifierTypes.slide)) {
						if (partEvent.notes.length > 1 && !partEvent.arpeggiator) {
							console.error(`Row: ${partEvent.row}, Col: ${partEvent.column} has multiple notes, slide, and no arpeggiator, playing only the first note`)
						}
						
						const slideParams = partEvent.modifiers.get(GridCellModifierTypes.slide) as SlideParams
						// Only if it's a slide and it's an instrument that supports slide
						if (slideParams.slide && track.source.AVAILABLE_SETTINGS.includes('slide')) {
							track.source.slideTo(notes[0], partEvent.velocity, time, slideParams.slide / 100)
							return;
						}
					}
					
					switch (partEvent.mode) {
						case GridCellNoteModeEnum.random:
							track.source.triggerAttackRelease(
								notes[Math.floor(Math.random() * partEvent.notes.length)],
								partEvent.duration,
								time,
								partEvent.velocity
							)
							break;
						
						case GridCellNoteModeEnum.arpeggio: // it's handled above, ignoring
						case GridCellNoteModeEnum.chord:
							notes.forEach((note) => {
								track.source.triggerAttackRelease(
									note,
									partEvent.duration,
									time,
									partEvent.velocity
								)
							})
							break;
						
						default:
							track.source
								.triggerAttackRelease(notes[0], partEvent.duration, time, partEvent.velocity);
					}
					
				} catch (e) {
					console.error(e)
				}
			}
		}),
		trackData.map(_ => {
			const step = _.column - 1
			
			return {
				time: getBarsBeatsSixteensFromStep(step),
				notes: _.notes,
				velocity: _.velocity / 100,
				duration: _.duration,
				modifiers: _.modifiers,
				column: _.column,
				row: _.row,
				arpeggiator: _.arpeggiator,
				mode: _.mode
			} as PartEvent
		})
	).set({
		loop: true,
		loopStart: 0,
		loopEnd: stepsToLoopLength(lengthInSteps),
	})
}
