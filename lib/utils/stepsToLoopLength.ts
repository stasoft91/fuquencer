import * as Tone from "tone/Tone";

// @ts-ignore
export const stepsToLoopLength = (parts: number) => Tone.Time('1m') - Tone.Time('16n') * (16 - parts)
