import {clamp} from '../layout/geometry';
import type {WorldLayout} from '../layout/worldLayout';
import type {EasingFn} from '../theme/motion';
import {EASE} from '../theme/motion';
import {DOMAIN_PLANS, FINAL, OUTRO} from '../timeline/timeline';
import type {Camera} from './camera';
import {
	OVERVIEW_WITH_CROWD_BOTTOM,
	domainBottomFraming,
	domainRestFraming,
	domainTopFraming,
	mixCamera,
	overviewFraming,
	withZoom,
} from './camera';

/**
 * Trajectoire de la caméra : une suite de segments entre deux cadrages.
 * Les cadrages sont recalculés à chaque image depuis la mise en page, ce qui
 * garde la caméra cohérente quand la structure se rassemble ou se simplifie.
 */
type Framing = (layout: WorldLayout) => Camera;

interface CameraSegment {
	readonly from: number;
	readonly to: number;
	readonly start: Framing;
	readonly end: Framing;
	readonly easing: EasingFn;
	/** Recul de caméra au milieu du segment (effet « grue »). */
	readonly arc: number;
}

const ENTRY_ZOOM = 1.14;
/** Durée pendant laquelle la vignette illustrée reste entièrement visible (images). */
const VIGNETTE_HOLD = 30;
const OVERVIEW_DRIFT = 1.035;

const buildSegments = (): CameraSegment[] => {
	const segments: CameraSegment[] = [];
	const top = (i: number): Framing => (l) => domainTopFraming(l, i);
	const bottom = (i: number): Framing => (l) => domainBottomFraming(l, i);
	const rest = (i: number, holdZoom: number): Framing => (l) => domainRestFraming(l, i, holdZoom);

	let previousRest: Framing | null = null;

	for (const plan of DOMAIN_PLANS) {
		const i = plan.index;
		const travelEnd = plan.travel.from + plan.travel.duration;
		segments.push({
			from: plan.travel.from,
			to: travelEnd,
			// Premier domaine : la caméra « se pose » depuis un cadrage légèrement plus serré.
			start: previousRest ?? ((l) => withZoom(domainTopFraming(l, i), ENTRY_ZOOM)),
			end: top(i),
			easing: previousRest ? EASE.camera : EASE.out,
			arc: plan.choreography.arc,
		});
		// Panoramique vertical vers les parcours, une fois la vignette illustrée bien vue ;
		// il se termine toujours avant la fin de la scène (pas de saut au trajet suivant).
		const holdEnd = plan.from + plan.duration;
		const panFrom = Math.min(Math.max(plan.rowsFrom, plan.vignetteAt + VIGNETTE_HOLD), holdEnd - 20);
		const panEnd = Math.min(Math.max(panFrom + 24, plan.buildEnd + 8), holdEnd);
		segments.push({from: panFrom, to: panEnd, start: top(i), end: bottom(i), easing: EASE.standard, arc: 0});
		// Pause de lecture (recul pour voir le domaine entier) seulement si le temps le permet.
		if (holdEnd - panEnd >= 12) {
			const restFraming = rest(i, plan.choreography.holdZoom);
			segments.push({from: panEnd, to: holdEnd, start: bottom(i), end: restFraming, easing: EASE.standard, arc: 0});
			previousRest = restFraming;
		} else {
			previousRest = bottom(i);
		}
	}

	const lastRest = previousRest ?? ((l: WorldLayout) => overviewFraming(l));
	segments.push({
		from: FINAL.from,
		to: FINAL.from + FINAL.cameraDuration,
		start: lastRest,
		end: overviewFraming,
		easing: EASE.camera,
		arc: 0,
	});
	// « choisissez votre parcours » : la structure remonte pour laisser place aux étudiants.
	const crowdFraming: Framing = (l) => overviewFraming(l, OVERVIEW_WITH_CROWD_BOTTOM);
	const crowdAt = FINAL.chooseAt - 22;
	segments.push({
		from: Math.max(FINAL.from + FINAL.cameraDuration, crowdAt),
		to: Math.max(FINAL.from + FINAL.cameraDuration, crowdAt) + 26,
		start: (l) => overviewFraming(l),
		end: crowdFraming,
		easing: EASE.standard,
		arc: 0,
	});
	segments.push({
		from: Math.max(FINAL.from + FINAL.cameraDuration, crowdAt) + 26,
		to: OUTRO.from + OUTRO.duration,
		start: crowdFraming,
		end: (l) => withZoom(crowdFraming(l), OVERVIEW_DRIFT),
		easing: EASE.standard,
		arc: 0,
	});
	return segments;
};

const SEGMENTS = buildSegments();

export const cameraAt = (frame: number, layout: WorldLayout): Camera => {
	const first = SEGMENTS[0];
	if (!first) {
		return overviewFraming(layout);
	}
	let segment = first;
	for (const s of SEGMENTS) {
		if (s.from <= frame) {
			segment = s;
		}
	}
	const t = clamp((frame - segment.from) / Math.max(1, segment.to - segment.from));
	const camera = mixCamera(segment.start(layout), segment.end(layout), segment.easing(t));
	if (segment.arc === 0) {
		return camera;
	}
	// sin² : recul nul et vitesse nulle aux extrémités, maximal au milieu du trajet.
	const dip = 1 - segment.arc * Math.pow(Math.sin(Math.PI * t), 2);
	return withZoom(camera, dip);
};
