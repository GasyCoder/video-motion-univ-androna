import {interpolateColors} from 'remotion';
import type {WorldState} from '../layout/worldLayout';
import {NAVY} from '../theme/colors';
import {DOMAIN_THEMES} from '../theme/domainThemes';
import {EASE} from '../theme/motion';
import {BUILD_BEATS} from '../timeline/choreography';
import type {ProgramPlan} from '../timeline/timeline';
import {DOMAIN_PLANS, FINAL} from '../timeline/timeline';
import {pulse, ramp} from './progress';

/** Rassemblement et simplification de la structure pendant la révélation finale. */
export const worldStateAt = (frame: number): WorldState => ({
	lod: ramp(frame, FINAL.from + FINAL.lodAt, FINAL.lodDuration, EASE.standard),
	assemble: ramp(frame, FINAL.from, FINAL.assembleDuration, EASE.standard),
});

/** Ouverture de l'espace d'un parcours : l'arbre grandit pendant son apparition. */
export const programExpansion = (plan: ProgramPlan, frame: number): number =>
	ramp(frame, plan.expandAt, BUILD_BEATS.rowExpand, EASE.standard);

/** Mise en valeur successive des domaines dans la vue d'ensemble. */
export const domainHighlight = (index: number, frame: number): number =>
	pulse(frame, FINAL.from + FINAL.highlightAt + index * FINAL.highlightStagger, FINAL.highlightDuration);

const ACCENT_STOPS = (() => {
	const frames: number[] = [0];
	const colors: string[] = [NAVY.bright];
	for (const plan of DOMAIN_PLANS) {
		// La teinte bascule à mi-parcours du trajet caméra vers le domaine.
		frames.push(plan.travel.from + plan.travel.duration * 0.5);
		colors.push(DOMAIN_THEMES[plan.domain.id].primary);
	}
	frames.push(FINAL.from + 30);
	colors.push(NAVY.bright);
	return {frames, colors};
})();

/** Couleur d'ambiance de l'arrière-plan (domaine actif). */
export const accentColorAt = (frame: number): string =>
	interpolateColors(frame, ACCENT_STOPS.frames, ACCENT_STOPS.colors);

/** Intensité des halos des quatre couleurs dans la vue d'ensemble. */
export const spectrumGlowAt = (frame: number): number => ramp(frame, FINAL.from + 16, 50, EASE.standard);
