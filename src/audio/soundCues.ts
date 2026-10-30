import {DOMAIN_PLANS, FINAL, FUTURES, GATEWAY, HOOK, OUTRO, TOGETHER} from '../timeline/timeline';

/**
 * Points de synchronisation du sound design, calculés depuis la timeline.
 * Seules les transitions importantes sont sonorisées.
 */
export type SoundKind = 'whoosh' | 'impact' | 'pop' | 'tick' | 'reveal' | 'resolve';

export interface SoundCue {
	readonly kind: SoundKind;
	readonly frame: number;
	readonly label: string;
	/** Volume relatif de ce point (multiplié par le volume de l'effet). */
	readonly gain: number;
}

const buildCues = (): SoundCue[] => {
	const cues: SoundCue[] = [
		{kind: 'whoosh', frame: HOOK.headlineAt - 2, label: 'Titre « Nouveaux bacheliers ? »', gain: 0.45},
		{kind: 'pop', frame: HOOK.bubbleAvenirAt, label: 'Question « avenir »', gain: 0.5},
		{kind: 'pop', frame: HOOK.bubbleFormationAt, label: 'Question « formation »', gain: 0.5},
		{kind: 'impact', frame: HOOK.gatewayAt + 2, label: 'L’université apparaît', gain: 0.8},
		...[0, 1, 2, 3].map((i): SoundCue => ({kind: 'pop', frame: GATEWAY.domainsAt + i * 5, label: `Domaine ${i + 1}`, gain: 0.35})),
		{kind: 'pop', frame: GATEWAY.mentionsAt - 2, label: '10 mentions', gain: 0.45},
		{kind: 'pop', frame: GATEWAY.programsAt - 2, label: '26 parcours', gain: 0.5},
		{kind: 'whoosh', frame: GATEWAY.exitAt - 4, label: 'Entrée dans l’organigramme', gain: 0.7},
	];
	for (const plan of DOMAIN_PLANS) {
		if (plan.index > 0) {
			cues.push({kind: 'whoosh', frame: plan.travel.from, label: `Trajet vers ${plan.domain.code}`, gain: 0.65});
		}
		cues.push({kind: 'impact', frame: plan.cardAt + 8, label: `Carte ${plan.domain.code}`, gain: 0.6});
		for (const mention of plan.mentions) {
			cues.push({kind: 'tick', frame: mention.revealAt - 3, label: `Branche ${mention.mention.code}`, gain: 0.3});
		}
	}
	cues.push(
		{kind: 'whoosh', frame: FUTURES.from, label: 'Vers l’avenir professionnel', gain: 0.55},
		{kind: 'pop', frame: FUTURES.careersAt, label: 'Avenirs professionnels', gain: 0.4},
		{kind: 'whoosh', frame: TOGETHER.from, label: 'Enseignants et équipes', gain: 0.5},
		...[TOGETHER.learnAt, TOGETHER.discoverAt, TOGETHER.innovateAt].map((frame, i): SoundCue => ({kind: 'pop', frame: frame - 2, label: `Tableau ${i + 1}`, gain: 0.35})),
		{kind: 'whoosh', frame: FINAL.from, label: 'Zoom arrière', gain: 0.8},
		{kind: 'reveal', frame: FINAL.from + FINAL.rootAt - 6, label: 'Révélation de la structure', gain: 0.75},
		{kind: 'impact', frame: FINAL.buildAt + 4, label: 'Diplôme', gain: 0.55},
		{kind: 'resolve', frame: OUTRO.from + OUTRO.titleAt, label: 'Carte de fin', gain: 0.8},
		{kind: 'tick', frame: OUTRO.from + OUTRO.clickAt, label: 'Clic sur « Découvrez nos formations »', gain: 0.8},
	);
	return cues.sort((a, b) => a.frame - b.frame);
};

export const SOUND_CUES: readonly SoundCue[] = buildCues();
