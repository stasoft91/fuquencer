import LegacySource, {type AbstractSourceOptions} from "~/lib/sources/LegacySource";
import RNBOSource from "~/lib/sources/RNBOSource";
import {SOURCE_TYPES} from "~/lib/SoundEngine";
import type {TrackExportOptions} from "~/lib/Track";
import {SmplrSource} from "~/lib/sources/SmplrSource";
import {TinySource} from "~/lib/sources/TinySource";
import type {DrumMachineOptions} from "~/modules/tonejs-smplr/src";
import {type SoundfontOptions} from "~/modules/tonejs-smplr/src";
import {SmplrDrumSource} from "~/lib/sources/SmplrDrumSource";
import {PulseqMonoSource, type PulseqOptions} from "~/lib/sources/PulseqMonoSource";

export type SourceType =
    LegacySource |
    RNBOSource |
    SmplrSource |
    SmplrDrumSource |
    TinySource |
    PulseqMonoSource;

export type SourceOptions = Pick<TrackExportOptions, 'sourceType' | 'source'>

export function createNewSource(sourceOptions: Pick<TrackExportOptions, 'sourceType' | 'source'>): SourceType {
	let source!: SourceType;
	
	switch (sourceOptions.sourceType) {
		case SOURCE_TYPES.legacyMono:
		case SOURCE_TYPES.sampler:
			source = new LegacySource(sourceOptions.source as AbstractSourceOptions);
			break;
		
		case SOURCE_TYPES.RNBO_Sub:
		case SOURCE_TYPES.RNBO_Acid:
		case SOURCE_TYPES.RNBO_Synth:
			source = new RNBOSource(sourceOptions.sourceType);
			break;
		
		case SOURCE_TYPES.SMPLR_Instrument:
			source = new SmplrSource(sourceOptions.source as SoundfontOptions)
			break;
		
		case SOURCE_TYPES.SMPLR_Drum:
			source = new SmplrDrumSource(sourceOptions.source as DrumMachineOptions)
			break;
		
		case SOURCE_TYPES.PulseqMono:
			source = new PulseqMonoSource(sourceOptions.source as PulseqOptions)
			break;

		default:
			throw new Error(`Unknown source type ${sourceOptions.sourceType}`);
	}

	return source;
}
