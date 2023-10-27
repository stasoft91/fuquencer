import {type GridCell} from "~/lib/GridCell";
import type {Pattern} from "~/lib/PatternManager";

export const patternToTrackData = (pattern: Pattern | undefined, row: number): GridCell[] => {
	return pattern?.cells.filter(_ => ((_.row === row) && (_.velocity > 0))) ?? []
}
