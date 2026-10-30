import type {SpringConfig} from 'remotion';
import {interpolate, spring} from 'remotion';
import {VIDEO} from '../config/video';
import type {EasingFn} from '../theme/motion';
import {EASE} from '../theme/motion';

/** Progression 0 → 1 entre `start` et `start + duration`, avec easing (jamais linéaire). */
export const ramp = (frame: number, start: number, duration: number, easing: EasingFn = EASE.standard): number =>
	interpolate(frame, [start, start + Math.max(1, duration)], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
		easing,
	});

/** Ressort physique déclenché à `start` (0 avant, peut légèrement dépasser 1). */
export const springAt = (frame: number, start: number, config: Partial<SpringConfig>): number =>
	spring({frame: frame - start, fps: VIDEO.fps, config});

/** Cloche 0 → 1 → 0 sur la durée (mise en valeur ponctuelle). */
export const pulse = (frame: number, start: number, duration: number): number =>
	Math.sin(Math.PI * ramp(frame, start, duration, EASE.standard));

/** Paramètres visuels d'une apparition « flou → net ». */
export const revealStyle = (progress: number, offset: {x?: number; y?: number}, blur = 8) => {
	const p = Math.max(0, progress);
	const inv = 1 - Math.min(1, p);
	return {
		opacity: Math.min(1, p * 1.4),
		transform: `translate(${(offset.x ?? 0) * (1 - p)}px, ${(offset.y ?? 0) * (1 - p)}px)`,
		filter: inv > 0.01 ? `blur(${inv * blur}px)` : undefined,
	};
};
