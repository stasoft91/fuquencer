export function createEuclideanRhythmVector(pulses: number, parts: number): (0 | 1)[] {
	if (parts < 1) {
		return [];
	}
	
	if (pulses < 1) {
		return Array(parts).fill(0);
	}
	
	if (pulses > parts) {
		return Array(parts).fill(1);
	}
	
	const pattern = Array(parts).fill(0);
	const distribution = Math.floor(parts / pulses);
	const remainder = parts % pulses;
	
	for (let i = 0; i < pulses; i++) {
		pattern[i * distribution + Math.min(i, remainder)] = 1;
	}
	
	return pattern;
}

export const shiftVector = (vector: (0 | 1)[], shift: number) => {
	return vector.slice(shift).concat(vector.slice(0, shift))
}
