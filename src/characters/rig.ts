import {interpolate} from 'remotion';
import {lerp} from '../layout/geometry';
import type {EasingFn} from '../theme/motion';
import {EASE} from '../theme/motion';

/**
 * Squelette d'un personnage vu de trois quarts, tourné vers la droite.
 * Repère local : origine entre les pieds, y vers le bas (unités ≈ px à l'échelle 1,
 * personnage d'environ 600 unités de haut).
 *
 * Angles en degrés, mesurés depuis la verticale descendante :
 * 0 = membre pendant, 90 = tendu vers l'avant, 180 = levé.
 * Le coude / genou est un angle relatif au segment précédent.
 */
export interface LimbPose {
	readonly shoulder: number;
	readonly elbow: number;
}

export interface LegPose {
	readonly hip: number;
	readonly knee: number;
}

export interface Pose {
	/** Inclinaison du buste (positif = vers l'avant). */
	readonly lean: number;
	/** Inclinaison de la tête (positif = vers le bas, négatif = regarde en haut). */
	readonly headTilt: number;
	/** Direction du regard : -1 (arrière) → 1 (avant), et -1 (bas) → 1 (haut). */
	readonly lookX: number;
	readonly lookY: number;
	readonly frontArm: LimbPose;
	readonly backArm: LimbPose;
	readonly frontLeg: LegPose;
	readonly backLeg: LegPose;
	/** Décalage vertical du corps (marche, assise). */
	readonly bob: number;
	/** 0 = neutre, 1 = sourire franc. */
	readonly smile: number;
}

export const BODY = {
	hipY: -286,
	hipFrontX: 10,
	hipBackX: -14,
	thigh: 142,
	shin: 135,
	shoulderFront: {x: 30, y: -462},
	shoulderBack: {x: -28, y: -466},
	upperArm: 112,
	forearm: 110,
	head: {x: 14, y: -540, rx: 42, ry: 49},
} as const;

const rad = (deg: number) => (deg * Math.PI) / 180;

export interface Point2 {
	readonly x: number;
	readonly y: number;
}

/** Point au bout d'un segment de longueur `len`, orienté par `angle` (0 = vers le bas). */
export const reach = (from: Point2, angle: number, len: number): Point2 => ({
	x: from.x + Math.sin(rad(angle)) * len,
	y: from.y + Math.cos(rad(angle)) * len,
});

export interface ArmChain {
	readonly shoulder: Point2;
	readonly elbow: Point2;
	readonly hand: Point2;
	/** Orientation de l'avant-bras (pour tenir un objet). */
	readonly handAngle: number;
}

export const armChain = (shoulder: Point2, limb: LimbPose): ArmChain => {
	const elbow = reach(shoulder, limb.shoulder, BODY.upperArm);
	const handAngle = limb.shoulder + limb.elbow;
	return {shoulder, elbow, hand: reach(elbow, handAngle, BODY.forearm), handAngle};
};

export const legChain = (hip: Point2, leg: LegPose) => {
	const knee = reach(hip, leg.hip, BODY.thigh);
	const ankle = reach(knee, leg.hip + leg.knee, BODY.shin);
	return {hip, knee, ankle};
};

// ---------------------------------------------------------------------------
// Poses de référence
// ---------------------------------------------------------------------------

const base: Pose = {
	lean: 0,
	headTilt: 0,
	lookX: 0.4,
	lookY: 0,
	frontArm: {shoulder: 8, elbow: 14},
	backArm: {shoulder: -6, elbow: 12},
	frontLeg: {hip: 5, knee: 0},
	backLeg: {hip: -5, knee: 0},
	bob: 0,
	smile: 0.35,
};

export const POSES = {
	stand: base,
	/** Main près du menton : réflexion. */
	think: {
		...base,
		headTilt: -6,
		lookX: 0.6,
		lookY: 0.7,
		smile: 0,
		frontArm: {shoulder: 22, elbow: 170},
		backArm: {shoulder: 26, elbow: 84},
	},
	/** Regarde vers le haut, émerveillé. */
	lookUp: {...base, headTilt: -14, lookY: 1, lookX: 0.6, smile: 0.7},
	/** Montre quelque chose devant / au-dessus. */
	point: {...base, headTilt: -8, lookY: 0.6, lookX: 1, smile: 0.6, frontArm: {shoulder: 118, elbow: 8}},
	/** Montre vers le bas, devant soi (vers la structure sous la vignette). */
	pointDown: {...base, lean: 4, headTilt: 10, lookY: -0.6, lookX: 1, smile: 0.5, frontArm: {shoulder: 62, elbow: 6}},
	/** Tient un objet à deux mains devant la poitrine (livre, tablette, dossier). */
	hold: {
		...base,
		headTilt: 12,
		lookY: -0.8,
		lookX: 0.8,
		smile: 0.4,
		frontArm: {shoulder: 22, elbow: 92},
		backArm: {shoulder: 30, elbow: 74},
	},
	/** Présente à un public (enseignant). */
	present: {...base, lean: -2, headTilt: -2, lookX: 1, smile: 0.6, frontArm: {shoulder: 96, elbow: 22}, backArm: {shoulder: 18, elbow: 40}},
	/** Main levée (question en cours). */
	raiseHand: {...base, headTilt: -6, lookY: 0.4, smile: 0.5, frontArm: {shoulder: 168, elbow: 14}},
	/** Bras levés (joie, diplôme). */
	cheer: {
		...base,
		headTilt: -10,
		lookY: 0.8,
		smile: 1,
		frontArm: {shoulder: 158, elbow: 16},
		backArm: {shoulder: 150, elbow: 20},
	},
	/** Se penche pour observer (microscope, plans). */
	observe: {
		...base,
		lean: 8,
		headTilt: 22,
		lookY: -0.9,
		lookX: 1,
		smile: 0.2,
		frontArm: {shoulder: 48, elbow: 40},
		backArm: {shoulder: 40, elbow: 50},
	},
} satisfies Record<string, Pose>;

export type PoseName = keyof typeof POSES;

const mixLimb = (a: LimbPose, b: LimbPose, t: number): LimbPose => ({
	shoulder: lerp(a.shoulder, b.shoulder, t),
	elbow: lerp(a.elbow, b.elbow, t),
});

const mixLeg = (a: LegPose, b: LegPose, t: number): LegPose => ({hip: lerp(a.hip, b.hip, t), knee: lerp(a.knee, b.knee, t)});

export const mixPose = (a: Pose, b: Pose, t: number): Pose => ({
	lean: lerp(a.lean, b.lean, t),
	headTilt: lerp(a.headTilt, b.headTilt, t),
	lookX: lerp(a.lookX, b.lookX, t),
	lookY: lerp(a.lookY, b.lookY, t),
	frontArm: mixLimb(a.frontArm, b.frontArm, t),
	backArm: mixLimb(a.backArm, b.backArm, t),
	frontLeg: mixLeg(a.frontLeg, b.frontLeg, t),
	backLeg: mixLeg(a.backLeg, b.backLeg, t),
	bob: lerp(a.bob, b.bob, t),
	smile: lerp(a.smile, b.smile, t),
});

/** Cycle de marche (phase 0 → 1 = deux pas). */
export const walkPose = (phase: number, from: Pose = base): Pose => {
	const s = Math.sin(phase * Math.PI * 2);
	const c = Math.cos(phase * Math.PI * 2);
	return {
		...from,
		lean: 3,
		frontLeg: {hip: 24 * s, knee: -Math.max(0, -c) * 34 - 4},
		backLeg: {hip: -24 * s, knee: -Math.max(0, c) * 34 - 4},
		frontArm: {shoulder: -20 * s, elbow: 18},
		backArm: {shoulder: 20 * s, elbow: 18},
		bob: -Math.abs(c) * 7,
	};
};

export interface PoseKey {
	readonly at: number;
	readonly pose: Pose;
	/** Durée de la transition vers cette pose (images). */
	readonly blend?: number;
	readonly easing?: EasingFn;
}

/** Pose à une image donnée, à partir d'une suite d'images clés (transitions adoucies). */
export const poseAt = (frame: number, keys: readonly PoseKey[]): Pose => {
	const first = keys[0];
	if (!first) {
		return base;
	}
	let pose = first.pose;
	for (const key of keys.slice(1)) {
		const blend = key.blend ?? 14;
		if (frame <= key.at - blend) {
			break;
		}
		const t = interpolate(frame, [key.at - blend, key.at], [0, 1], {
			extrapolateLeft: 'clamp',
			extrapolateRight: 'clamp',
			easing: key.easing ?? EASE.standard,
		});
		pose = mixPose(pose, key.pose, t);
	}
	return pose;
};

/** Micro-mouvements de vie : respiration, balancement de tête (déterministes). */
export const idle = (frame: number, seed: number) => {
	const t = (frame + seed * 41) / 30;
	return {
		breath: Math.sin(t * Math.PI * 0.75) * 0.5 + 0.5,
		sway: Math.sin(t * Math.PI * 0.42 + seed),
		/** Clignement : quelques images toutes les 3 à 4 secondes. */
		blink: (Math.floor(frame + seed * 53) % (96 + (seed % 3) * 17)) < 4,
	};
};
