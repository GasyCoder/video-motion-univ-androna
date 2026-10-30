import type {Domain, Mention, Program} from '../data/academicStructure';
import {ACADEMIC_STRUCTURE} from '../data/academicStructure';
import type {SegmentId} from '../narration/narration';
import {speechEnd, wordAt} from '../narration/narration';
import type {DomainChoreography} from './choreography';
import {BUILD_BEATS, DOMAIN_CHOREOGRAPHY} from './choreography';

/**
 * Timeline unique de la vidéo (images à 30 fps, valeurs absolues), pilotée par
 * la voix off : chaque scène se cale sur la durée mesurée des clips de narration
 * et sur l'instant où certains mots sont prononcés. Régénérer la voix
 * (npm run voice) recale donc automatiquement toute la vidéo.
 */

export interface TimeWindow {
	readonly from: number;
	readonly duration: number;
}

export interface ProgramPlan {
	readonly program: Program;
	readonly index: number;
	/** Ouverture de l'espace du parcours dans l'arbre. */
	readonly expandAt: number;
	readonly branchAt: number;
	readonly revealAt: number;
}

export interface MentionPlan {
	readonly mention: Mention;
	readonly index: number;
	readonly branchAt: number;
	readonly branchDuration: number;
	readonly revealAt: number;
	readonly programs: readonly ProgramPlan[];
}

export interface DomainPlan {
	readonly domain: Domain;
	readonly index: number;
	readonly choreography: DomainChoreography;
	readonly from: number;
	readonly duration: number;
	/** Trajet caméra vers ce domaine. */
	readonly travel: TimeWindow;
	readonly cardAt: number;
	/** La vignette illustrée apparaît quand la carte se pose. */
	readonly vignetteAt: number;
	/** Le nom du domaine est prononcé. */
	readonly voiceAt: number;
	readonly mentions: readonly MentionPlan[];
	/** Premier parcours : début du panoramique vertical de la caméra. */
	readonly rowsFrom: number;
	/** Fin de la construction de l'arbre : début de la pause. */
	readonly buildEnd: number;
}

const VOICE_AT: Partial<Record<SegmentId, number>> = {};

// ---------------------------------------------------------------------------
// Scène 01 — Accroche : l'étudiante et ses questions
// ---------------------------------------------------------------------------

/** La voix démarre presque immédiatement : l'accroche tient dans la première seconde. */
const HOOK_VOICE = 4;
VOICE_AT.question = HOOK_VOICE;
const GATEWAY_VOICE = HOOK_VOICE + speechEnd('question') + 6;

export const HOOK = {
	from: 0,
	walkDuration: 30,
	/** « Nouveaux bacheliers ? » : titre animé en haut de l'écran. */
	headlineAt: HOOK_VOICE,
	bubbleFormationAt: HOOK_VOICE + wordAt('question', 'formation') - 4,
	bubbleAvenirAt: HOOK_VOICE + wordAt('question', 'avenir') - 4,
	/** « La réponse : l'Université d'Androna ! » — le bandeau se pose sur le nom. */
	gatewayAt: GATEWAY_VOICE + wordAt('universite', 'Université') - 6,
} as const;

// ---------------------------------------------------------------------------
// Scène 02 — L'université et ses quatre domaines
// ---------------------------------------------------------------------------

VOICE_AT.universite = GATEWAY_VOICE;

export const GATEWAY = {
	from: HOOK.gatewayAt,
	voiceAt: GATEWAY_VOICE,
	/** « Quatre domaines, dix mentions, vingt-six parcours ! » : un chiffre par mot. */
	domainsAt: GATEWAY_VOICE + wordAt('universite', 'quatre'),
	mentionsAt: GATEWAY_VOICE + wordAt('universite', 'dix'),
	programsAt: GATEWAY_VOICE + wordAt('universite', 'vingt'),
	exitAt: GATEWAY_VOICE + speechEnd('universite') + 4,
	exitDuration: 12,
} as const;

/** Fin de l'ouverture (accroche + université). */
export const OPENING_END = GATEWAY.exitAt + GATEWAY.exitDuration;

// ---------------------------------------------------------------------------
// Scènes 03-06 — Un domaine par scène (nom prononcé à l'arrivée de la carte)
// ---------------------------------------------------------------------------

const DOMAINS_FROM = GATEWAY.exitAt + 2;
/** Le nom du domaine est prononcé pendant l'entrée de la carte. */
const DOMAIN_VOICE_DELAY = 8;

const planDomain = (domain: Domain, index: number, from: number, isLast: boolean): DomainPlan => {
	const choreography = DOMAIN_CHOREOGRAPHY[domain.id];
	const b = BUILD_BEATS;
	const cardAt = from + choreography.cardDelay;
	const trunkAt = cardAt + b.trunkAfterCard;
	const voiceAt = from + DOMAIN_VOICE_DELAY;
	VOICE_AT[domain.id] = voiceAt;

	const mentionTimings = domain.mentions.map((mention, i) => {
		const branchAt = trunkAt + i * b.mentionStagger;
		const branchDuration = b.mentionDraw + i * b.mentionDrawPerIndex;
		return {mention, index: i, branchAt, branchDuration, revealAt: branchAt + branchDuration - b.mentionRevealLead};
	});

	const rowsFrom = Math.max(...mentionTimings.map((m) => m.revealAt)) + b.groupsAfterMentions;
	let cursor = rowsFrom;
	const mentions: MentionPlan[] = mentionTimings.map((timing) => {
		const programs = timing.mention.programs.map((program, j): ProgramPlan => {
			const expandAt = cursor + j * b.rowStagger;
			return {program, index: j, expandAt, branchAt: expandAt + b.rowBranchDelay, revealAt: expandAt + b.rowRevealDelay};
		});
		cursor += timing.mention.programs.length * b.rowStagger + b.groupGap;
		return {...timing, programs};
	});

	const buildEnd = Math.max(...mentions.flatMap((m) => m.programs.map((p) => p.expandAt))) + b.rowSettle;
	// Le trajet suivant démarre dès le dernier mot : la voix s'enchaîne sans temps mort.
	let end = Math.max(buildEnd + b.hold, voiceAt + speechEnd(domain.id) + 2);
	if (isLast) {
		// « Des parcours conçus… » : la phrase commence sur le dernier arbre.
		const parcoursAt = voiceAt + speechEnd(domain.id) + 6;
		VOICE_AT.parcours = parcoursAt;
		end = Math.max(end, parcoursAt + wordAt('parcours', 'conçus') - 2);
	}

	return {
		domain,
		index,
		choreography,
		from,
		duration: end - from,
		travel: {from, duration: choreography.travel},
		cardAt,
		vignetteAt: cardAt + 12,
		voiceAt,
		mentions,
		rowsFrom,
		buildEnd,
	};
};

const planDomains = (): DomainPlan[] => {
	const plans: DomainPlan[] = [];
	let from = DOMAINS_FROM;
	ACADEMIC_STRUCTURE.forEach((domain, index) => {
		const plan = planDomain(domain, index, from, index === ACADEMIC_STRUCTURE.length - 1);
		plans.push(plan);
		from += plan.duration;
	});
	return plans;
};

export const DOMAIN_PLANS: readonly DomainPlan[] = planDomains();

const lastDomain = DOMAIN_PLANS[DOMAIN_PLANS.length - 1];
const DOMAINS_END = lastDomain ? lastDomain.from + lastDomain.duration : DOMAINS_FROM;
const PARCOURS_VOICE = VOICE_AT.parcours ?? DOMAINS_END;

// ---------------------------------------------------------------------------
// Scène 07 — Du projet d'études à l'avenir professionnel
// ---------------------------------------------------------------------------

export const FUTURES = {
	from: DOMAINS_END,
	/** « …votre projet d'études » */
	projectAt: PARCOURS_VOICE + wordAt('parcours', 'projet'),
	/** « …et votre avenir professionnel ! » */
	careersAt: PARCOURS_VOICE + wordAt('parcours', 'avenir'),
	end: PARCOURS_VOICE + speechEnd('parcours') + 8,
} as const;

// ---------------------------------------------------------------------------
// Scène 08 — Étudiants, enseignants et équipes universitaires
// ---------------------------------------------------------------------------

const TOGETHER_VOICE = FUTURES.end + 4;
VOICE_AT.ensemble = TOGETHER_VOICE;

export const TOGETHER = {
	from: FUTURES.end,
	voiceAt: TOGETHER_VOICE,
	studentsAt: TOGETHER_VOICE + wordAt('ensemble', 'Étudiants'),
	teacherAt: TOGETHER_VOICE + wordAt('ensemble', 'enseignants'),
	staffAt: TOGETHER_VOICE + wordAt('ensemble', 'équipes'),
	togetherAt: TOGETHER_VOICE + wordAt('ensemble', 'ensemble'),
	learnAt: TOGETHER_VOICE + wordAt('ensemble', 'apprend'),
	discoverAt: TOGETHER_VOICE + wordAt('ensemble', 'découvre'),
	innovateAt: TOGETHER_VOICE + wordAt('ensemble', 'innove'),
	end: TOGETHER_VOICE + speechEnd('ensemble') + 8,
} as const;

// ---------------------------------------------------------------------------
// Scène 09 — Révélation de toute la structure, puis carte de fin
// ---------------------------------------------------------------------------

const FINAL_FROM = TOGETHER.end;
const FINAL_VOICE = FINAL_FROM + 6;
VOICE_AT.avenir = FINAL_VOICE;
const UNIVERSITY_WORD = FINAL_VOICE + wordAt('avenir', 'Université');

export const FINAL = {
	from: FINAL_FROM,
	duration: UNIVERSITY_WORD - 4 - FINAL_FROM,
	voiceAt: FINAL_VOICE,
	/** « Explorez les formations » : la structure complète se dévoile. */
	exploreAt: FINAL_VOICE,
	/** « choisissez votre parcours » : l'étudiante désigne un parcours. */
	chooseAt: FINAL_VOICE + wordAt('avenir', 'choisissez'),
	/** « construisez votre avenir » : l'étudiante devient diplômée. */
	buildAt: FINAL_VOICE + wordAt('avenir', 'construisez'),
	/** Rapprochement des quatre arbres (relatif). */
	assembleDuration: 50,
	/** Passage en vue simplifiée : les descriptions s'effacent. */
	lodAt: 4,
	lodDuration: 40,
	cameraDuration: 58,
	rootAt: 20,
	spineAt: 34,
	spineDuration: 28,
	/** Mise en valeur successive des quatre domaines (relatif, calé sur « choisissez »). */
	highlightAt: FINAL_VOICE + wordAt('avenir', 'choisissez') - FINAL_FROM,
	highlightStagger: 7,
	highlightDuration: 26,
} as const;

/** Temps de lecture de la carte de fin après la dernière syllabe. */
const END_HOLD = 66;

export const OUTRO = {
	from: FINAL.from + FINAL.duration,
	duration: FINAL_VOICE + speechEnd('avenir') + END_HOLD - (FINAL.from + FINAL.duration),
	panelDuration: 30,
	worldFadeDuration: 20,
	titleAt: 4,
	titleDuration: 32,
	/** Appel à l'action et accroche de campagne (relatifs). */
	ctaAt: FINAL_VOICE + speechEnd('avenir') - (FINAL.from + FINAL.duration) - 6,
	/** Le curseur vient cliquer sur l'appel à l'action (relatif). */
	clickAt: FINAL_VOICE + speechEnd('avenir') - (FINAL.from + FINAL.duration) + 18,
	hookAt: FINAL_VOICE + speechEnd('avenir') - (FINAL.from + FINAL.duration) + 14,
	spectrumAt: 26,
} as const;

export const TOTAL_DURATION = OUTRO.from + OUTRO.duration;

/** Placement absolu de chaque clip de voix off. */
export const VOICE_PLACEMENT: Record<SegmentId, number> = {
	question: VOICE_AT.question ?? 0,
	universite: VOICE_AT.universite ?? 0,
	alsh: VOICE_AT.alsh ?? 0,
	st: VOICE_AT.st ?? 0,
	ss: VOICE_AT.ss ?? 0,
	si: VOICE_AT.si ?? 0,
	parcours: PARCOURS_VOICE,
	ensemble: VOICE_AT.ensemble ?? 0,
	avenir: VOICE_AT.avenir ?? 0,
};

/** Plage d'affichage du monde (arbres + caméra). */
export const WORLD_WINDOW: TimeWindow = {
	from: DOMAINS_FROM,
	duration: OUTRO.from + OUTRO.worldFadeDuration - DOMAINS_FROM,
};
