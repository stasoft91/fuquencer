import type {ADSRType, AudioSource} from "../SoundEngine";

export function getEnvelopeOfAudioSource(audioSource: AudioSource): ADSRType {
	const rawEnvelope = 'envelope' in audioSource ? audioSource.envelope.get() : audioSource.get()
	return {
		attack: rawEnvelope.attack || 0,
		decay: rawEnvelope.decay || 0,
		sustain: rawEnvelope.sustain || 0,
		release: rawEnvelope.release || 0
	} as ADSRType
}
