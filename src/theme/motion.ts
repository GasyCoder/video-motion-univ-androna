import type {SpringConfig} from 'remotion';
import {Easing} from 'remotion';

export type EasingFn = (t: number) => number;

/**
 * Courbes d'accélération. Aucune transition linéaire : chaque mouvement suit
 * anticipation → accélération → décélération.
 */
export const EASE = {
	/** Mouvement standard, symétrique. */
	standard: Easing.bezier(0.65, 0, 0.35, 1),
	/** Entrées : départ vif, arrivée très amortie. */
	out: Easing.bezier(0.22, 1, 0.36, 1),
	/** Sorties : départ retenu, accélération finale. */
	in: Easing.bezier(0.64, 0, 0.78, 0),
	/** Caméra : départ retenu (poids), longue décélération. */
	camera: Easing.bezier(0.72, 0, 0.18, 1),
	/** Tracé des connecteurs. */
	draw: Easing.bezier(0.5, 0, 0.15, 1),
} satisfies Record<string, EasingFn>;

export const SPRINGS = {
	/** Grandes cartes : léger dépassement, posé. */
	card: {damping: 17, stiffness: 115, mass: 1},
	/** Apparitions de cartes secondaires : sans rebond visible. */
	reveal: {damping: 22, stiffness: 140, mass: 0.8},
	/** Pastilles, icônes : petit rebond. */
	pop: {damping: 11, stiffness: 170, mass: 0.7},
	/** Typographie : souple, sans dépassement. */
	text: {damping: 200, stiffness: 120, mass: 1},
} satisfies Record<string, Partial<SpringConfig>>;
