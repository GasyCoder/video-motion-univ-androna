import {lerp} from '../layout/geometry';

/**
 * Bloc-titre « UNIVERSITÉ / D'ANDRONA » + « ORGANIGRAMME ACADÉMIQUE ».
 * Le même bloc passe d'une variante à l'autre (intro → bandeau → racine → outro).
 */
export interface LockupMetrics {
	readonly titleSize: number;
	/** Interlettrage du titre, en em. */
	readonly titleTracking: number;
	readonly lineGap: number;
	readonly subtitleSize: number;
	readonly subtitleTracking: number;
	readonly subtitleGap: number;
}

export const LOCKUP = {
	hero: {titleSize: 106, titleTracking: 0.01, lineGap: 6, subtitleSize: 34, subtitleTracking: 0.34, subtitleGap: 40},
	header: {titleSize: 50, titleTracking: 0.02, lineGap: 2, subtitleSize: 21, subtitleTracking: 0.3, subtitleGap: 18},
	root: {titleSize: 118, titleTracking: 0.02, lineGap: 4, subtitleSize: 42, subtitleTracking: 0.3, subtitleGap: 30},
} as const satisfies Record<string, LockupMetrics>;

export const TITLE_LINE_HEIGHT = 1;
export const SUBTITLE_LINE_HEIGHT = 1.2;

export const lockupHeight = (m: LockupMetrics): number =>
	2 * m.titleSize * TITLE_LINE_HEIGHT + m.lineGap + m.subtitleGap + m.subtitleSize * SUBTITLE_LINE_HEIGHT;

export const mixLockup = (a: LockupMetrics, b: LockupMetrics, t: number): LockupMetrics => ({
	titleSize: lerp(a.titleSize, b.titleSize, t),
	titleTracking: lerp(a.titleTracking, b.titleTracking, t),
	lineGap: lerp(a.lineGap, b.lineGap, t),
	subtitleSize: lerp(a.subtitleSize, b.subtitleSize, t),
	subtitleTracking: lerp(a.subtitleTracking, b.subtitleTracking, t),
	subtitleGap: lerp(a.subtitleGap, b.subtitleGap, t),
});

export const scaleLockup = (m: LockupMetrics, k: number): LockupMetrics => ({
	...m,
	titleSize: m.titleSize * k,
	lineGap: m.lineGap * k,
	subtitleSize: m.subtitleSize * k,
	subtitleGap: m.subtitleGap * k,
});

/** Bandeau institutionnel : éléments décoratifs (à l'échelle 1). */
export const BANNER = {
	iconSize: 132,
	iconInset: 140,
	accentWidth: 280,
	accentHeight: 7,
	accentGap: 30,
} as const;

/** Hauteur du contenu du bandeau (titre + ligne d'accent) pour une échelle donnée. */
export const bannerContentHeight = (metrics: LockupMetrics, scale: number): number =>
	lockupHeight(metrics) + (BANNER.accentGap + BANNER.accentHeight) * scale;
