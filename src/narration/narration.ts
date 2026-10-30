import {VIDEO} from '../config/video';
import manifest from './narration.generated.json';
import script from './narration.json';

/**
 * Narration : texte source (narration.json) + mesures de la voix générée
 * (narration.generated.json, écrit par scripts/narration/generate.py).
 * La timeline se cale sur ces durées et sur l'horodatage des mots.
 */
export const SEGMENT_IDS = ['question', 'universite', 'alsh', 'st', 'ss', 'si', 'parcours', 'ensemble', 'avenir'] as const;
export type SegmentId = (typeof SEGMENT_IDS)[number];

export interface NarrationWord {
	readonly text: string;
	readonly start: number;
	readonly end: number;
}

export interface NarrationSegment {
	readonly id: SegmentId;
	/** Texte avec marqueurs de sous-titres (« | ») et de mise en valeur (« *…* »). */
	readonly text: string;
	readonly subtitles: boolean;
	readonly file: string;
	/** Durée du clip (secondes) et en images. */
	readonly duration: number;
	readonly frames: number;
	readonly words: readonly NarrationWord[];
}

const isSegmentId = (id: string): id is SegmentId => (SEGMENT_IDS as readonly string[]).includes(id);

const buildSegments = (): Record<SegmentId, NarrationSegment> => {
	const entries = SEGMENT_IDS.map((id): [SegmentId, NarrationSegment] => {
		const source = script.segments.find((s) => s.id === id);
		const measured = manifest.segments.find((s) => s.id === id);
		if (!source || !measured || !isSegmentId(measured.id)) {
			throw new Error(`Segment de narration « ${id} » absent : relancer « npm run voice ».`);
		}
		return [
			id,
			{
				id,
				text: source.text,
				subtitles: source.subtitles,
				file: measured.file,
				duration: measured.duration,
				frames: Math.ceil(measured.duration * VIDEO.fps),
				words: measured.words,
			},
		];
	});
	return Object.fromEntries(entries) as Record<SegmentId, NarrationSegment>;
};

export const NARRATION: Record<SegmentId, NarrationSegment> = buildSegments();

export const NARRATION_VOICE = {
	provider: manifest.provider,
	voice: manifest.voice,
	license: manifest.license,
} as const;

const normalize = (w: string) =>
	w
		.toLowerCase()
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.replace(/[^a-z0-9]/g, '');

/**
 * Image (relative au début du clip) où commence un mot de la narration.
 * `occurrence` choisit la n-ième apparition du mot dans le segment.
 */
export const wordAt = (id: SegmentId, word: string, occurrence = 0): number => {
	const target = normalize(word);
	const matches = NARRATION[id].words.filter((w) => normalize(w.text).includes(target));
	const found = matches[occurrence] ?? matches[0];
	if (!found) {
		throw new Error(`Mot « ${word} » introuvable dans le segment « ${id} ».`);
	}
	return Math.round(found.start * VIDEO.fps);
};

/** Fin (relative) du dernier mot prononcé du segment. */
export const speechEnd = (id: SegmentId): number => {
	const last = NARRATION[id].words[NARRATION[id].words.length - 1];
	return Math.round((last?.end ?? NARRATION[id].duration) * VIDEO.fps);
};
