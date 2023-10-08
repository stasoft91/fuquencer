import * as Tone from "tone/Tone";

export const stepsToLoopLength = (parts: number) => Tone.Time('1m').toSeconds() - Tone.Time('16n').toSeconds() * (16 - parts)
