import type {ADSRType} from "../SoundEngine";
import LegacySource from "~/lib/sources/LegacySource";

export function getEnvelopeOfAudioSource(audioSource: LegacySource): ADSRType {
	const rawEnvelope = audioSource.envelope?.get();

	return {
		attack: rawEnvelope?.attack || audioSource.attack! || 0,
		decay: rawEnvelope?.decay || 0,
		sustain: rawEnvelope?.sustain || 0,
		release: rawEnvelope?.release || audioSource.release! || 0
	} as ADSRType
}
