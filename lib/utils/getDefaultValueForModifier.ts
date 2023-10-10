import {type GridCellModifier, GridCellModifierTypes} from "~/lib/GridCell.types";
import * as Tone from "tone/Tone";

export function getDefaultValueForModifier(type: GridCellModifierTypes): GridCellModifier {
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
        case GridCellModifierTypes.reverse:
            return {type}
        case GridCellModifierTypes.playbackRate:
            return {type, playbackRate: 1}
    }
}
