import type {DomainId} from '../data/academicStructure';

export interface CardEntrance {
	readonly x: number;
	readonly y: number;
	readonly scale: number;
	readonly rotate: number;
}

/**
 * Variations de mise en scène par domaine : même grammaire visuelle,
 * mais chaque domaine arrive différemment pour éviter l'effet copier-coller.
 */
export interface DomainChoreography {
	/** Durée du trajet caméra qui amène sur le domaine (images). */
	readonly travel: number;
	/** Recul de caméra au milieu du trajet (0 = aucun, 0.3 = zoom -30 %). */
	readonly arc: number;
	/** Délai d'entrée de la grande carte domaine après le début de la scène. */
	readonly cardDelay: number;
	/** Position de départ de la carte domaine, relative à sa position finale. */
	readonly cardFrom: CardEntrance;
	/** Variation de zoom appliquée au cadrage de pause (< 1 : recul, > 1 : la caméra avance). */
	readonly holdZoom: number;
}

export const DOMAIN_CHOREOGRAPHY: Record<DomainId, DomainChoreography> = {
	// Arrivée depuis la présentation : la carte entre par la gauche, caméra posée.
	alsh: {
		travel: 26,
		arc: 0,
		cardDelay: 4,
		cardFrom: {x: -1150, y: 0, scale: 1, rotate: 0},
		holdZoom: 1,
	},
	// Travelling latéral : la carte arrive dans le sens du mouvement.
	st: {
		travel: 26,
		arc: 0.26,
		cardDelay: 10,
		cardFrom: {x: 760, y: 0, scale: 0.96, rotate: 0},
		holdZoom: 1,
	},
	// Long trajet en diagonale : la carte monte, puis la caméra avance dans la structure.
	ss: {
		travel: 28,
		arc: 0.34,
		cardDelay: 12,
		cardFrom: {x: 0, y: 440, scale: 0.92, rotate: 0},
		holdZoom: 1.04,
	},
	// Ingénierie : entrée plus dynamique (échelle + légère rotation qui se pose).
	si: {
		travel: 26,
		arc: 0.26,
		cardDelay: 10,
		cardFrom: {x: 0, y: 170, scale: 0.78, rotate: -2.5},
		holdZoom: 1,
	},
};

/** Rythme commun de construction d'un arbre (en images à 30 fps), resserré pour suivre la voix off. */
export const BUILD_BEATS = {
	/** Début du tronc après l'entrée de la carte domaine. */
	trunkAfterCard: 12,
	/** Décalage entre les départs des branches de mentions. */
	mentionStagger: 3,
	/** Durée de tracé de la première branche, puis allongement par mention. */
	mentionDraw: 12,
	mentionDrawPerIndex: 3,
	/** La carte mention commence à apparaître juste avant l'arrivée du tracé. */
	mentionRevealLead: 4,
	/** Pause entre l'apparition de la dernière mention et les premiers parcours. */
	groupsAfterMentions: 4,
	/** Décalage entre deux parcours d'une même mention. */
	rowStagger: 3,
	/** Pause supplémentaire entre deux groupes de parcours. */
	groupGap: 3,
	/** Durée d'ouverture de l'espace d'un parcours (l'arbre grandit). */
	rowExpand: 12,
	rowBranchDelay: 2,
	rowBranchDraw: 10,
	rowRevealDelay: 4,
	/** Temps de stabilisation après le dernier parcours. */
	rowSettle: 12,
	/** Pause minimale avant le déplacement suivant (la voix peut l'allonger). */
	hold: 8,
} as const;
