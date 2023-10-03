import LegacySource, {type AbstractSourceOptions} from "~/lib/sources/LegacySource";
import RNBOSource from "~/lib/sources/RNBOSource";
import {TRACK_TYPES} from "~/lib/SoundEngine";
import type {TrackExportOptions} from "~/lib/Track";

export type SourceType = LegacySource | RNBOSource;

export function createNewSource(trackOptions: Pick<TrackExportOptions, 'sourceType' | 'source'>): SourceType {
	let source!: LegacySource | RNBOSource;

	switch (trackOptions.sourceType) {
		case TRACK_TYPES.legacyMono:
		case TRACK_TYPES.sampler:
			source = new LegacySource(trackOptions.source as AbstractSourceOptions);
			break;

		case TRACK_TYPES.RNBO_Sub:
		case TRACK_TYPES.RNBO_Acid:
		case TRACK_TYPES.RNBO_Drone:
		case TRACK_TYPES.RNBO_Synth:
		case TRACK_TYPES.RNBO_Additive:
			source = new RNBOSource(trackOptions.sourceType);
			break;


		default:
			throw new Error(`Unknown source type ${trackOptions.sourceType}`);
	}

	return source;
}
