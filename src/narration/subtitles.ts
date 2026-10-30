import {VIDEO} from '../config/video';
import {VOICE_PLACEMENT} from '../timeline/timeline';
import type {SegmentId} from './narration';
import {NARRATION, SEGMENT_IDS} from './narration';

/** Morceau de sous-titre : une idée courte, une à deux lignes. */
export interface SubtitleChunk {
	readonly id: string;
	/** Texte avec marqueurs de mise en valeur « *…* ». */
	readonly text: string;
	readonly from: number;
	readonly to: number;
}

const LEAD = 2;
const TAIL = 12;

const chunksOf = (id: SegmentId): SubtitleChunk[] => {
	const segment = NARRATION[id];
	const start = VOICE_PLACEMENT[id];
	const parts = segment.text.split('|').map((p) => p.trim());
	let wordIndex = 0;
	const chunks = parts.map((text, i) => {
		// Même découpage que le générateur de voix : « ? », « ! », « : » restent collés au mot.
		const count = text.replace(/\*/g, '').replace(/\s+([?!:;])/g, '$1').split(/\s+/).filter(Boolean).length;
		const first = segment.words[wordIndex];
		const last = segment.words[wordIndex + count - 1];
		wordIndex += count;
		return {
			id: `${id}-${i}`,
			text,
			from: start + Math.round((first?.start ?? 0) * VIDEO.fps) - LEAD,
			to: start + Math.round((last?.end ?? segment.duration) * VIDEO.fps),
		};
	});
	// Chaque morceau reste affiché jusqu'au suivant ; le dernier un peu après la voix.
	return chunks.map((c, i) => ({...c, to: chunks[i + 1]?.from ?? c.to + TAIL}));
};

export const SUBTITLES: readonly SubtitleChunk[] = SEGMENT_IDS.filter((id) => NARRATION[id].subtitles).flatMap(chunksOf);
