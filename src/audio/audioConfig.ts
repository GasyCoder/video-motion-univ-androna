import type {SoundKind} from './soundCues';

/**
 * Mixage : trois couches, priorité VOIX > MUSIQUE > EFFETS.
 *
 * Tous les fichiers sont produits par le projet (droits maîtrisés) :
 * - voix : scripts/narration/generate.py (voir NARRATION_VOICE) ;
 * - musique et effets : composition et synthèse originales, scripts/audio/compose.py.
 * Pour utiliser une autre musique, remplacer le fichier par une piste libre de droits
 * ou sous licence, au même chemin (public/audio/music/…).
 */
export interface AudioAsset {
	/** Chemin relatif à public/. */
	readonly src: string;
	/** Gain linéaire (0 → 1). */
	readonly volume: number;
}

/**
 * Clips de voix mono à -15 LUFS : Remotion les répartit à plein niveau sur les deux canaux
 * (+3 dB en mesure stéréo). -1,5 dB vise un mix final vers -14 LUFS, norme des réseaux sociaux.
 */
export const VOICE_VOLUME = 0.84;

export const MUSIC: AudioAsset = {src: 'audio/music/orientation-theme.mp3', volume: 1};

/** Automation de la musique, en dB relatifs au fichier (lui-même normalisé). */
export const MUSIC_MIX = {
	/** Niveau du lit musical hors narration. */
	bedDb: -6,
	/** Atténuation supplémentaire pendant que la voix parle (ducking). */
	duckDb: -8,
	/** Montée / relâchement du ducking (images). */
	duckAttack: 6,
	duckRelease: 16,
	fadeIn: 20,
	fadeOut: 40,
} as const;

export const SFX: Record<SoundKind, AudioAsset> = {
	whoosh: {src: 'audio/sfx/whoosh.mp3', volume: 0.45},
	impact: {src: 'audio/sfx/impact.mp3', volume: 0.5},
	pop: {src: 'audio/sfx/pop.mp3', volume: 0.4},
	tick: {src: 'audio/sfx/tick.mp3', volume: 0.35},
	reveal: {src: 'audio/sfx/reveal.mp3', volume: 0.45},
	resolve: {src: 'audio/sfx/resolve.mp3', volume: 0.5},
};

/** Couches audibles (rendus de contrôle : isoler une couche pour mesurer son niveau). */
export type AudioMix = 'all' | 'voice' | 'music' | 'sfx' | 'none';
