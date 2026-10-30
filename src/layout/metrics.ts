import {FONT_FAMILY} from '../theme/fonts';

/**
 * Dimensions de l'arbre d'un domaine, en unités « monde ».
 * Pendant les scènes de domaine la caméra est à zoom 1 : 1 unité = 1 px
 * à l'écran. Les tailles de texte sont donc celles lues sur le téléphone.
 */
export const TREE = {
	width: 860,
	/** Abscisse du tronc qui relie la carte domaine aux mentions. */
	trunkX: 40,
	connectorRadius: 22,
	strokeWidth: 6,
	domain: {
		radius: 44,
		padX: 52,
		padY: 44,
		iconSize: 136,
		iconGap: 40,
		code: {family: FONT_FAMILY.display, weight: 800, size: 148},
		codeLineHeight: 1,
		label: {family: FONT_FAMILY.text, weight: 600, size: 40},
		labelLineHeight: 1.18,
		codeLabelGap: 10,
	},
	mention: {
		x: 88,
		radius: 28,
		padLeft: 46,
		padRight: 34,
		padY: 24,
		compactPadY: 14,
		accentWidth: 10,
		code: {family: FONT_FAMILY.display, weight: 800, size: 54},
		codeLineHeight: 1.08,
		label: {family: FONT_FAMILY.text, weight: 500, size: 34},
		labelLineHeight: 1.24,
		codeLabelGap: 4,
		/** Espace entre acronyme et intitulé en disposition « en ligne ». */
		inlineGap: 26,
		/** Abscisse (relative à la carte) de la branche vers les parcours. */
		branchInset: 40,
	},
	program: {
		x: 176,
		radius: 22,
		padX: 28,
		padY: 19,
		code: {family: FONT_FAMILY.display, weight: 800, size: 34},
		codeLineHeight: 1.15,
		label: {family: FONT_FAMILY.text, weight: 500, size: 31},
		labelLineHeight: 1.28,
		columnGap: 22,
		compactHeight: 56,
	},
	/** Espacements : [détail, vue d'ensemble simplifiée]. */
	gaps: {
		domainToMention: {detail: 60, compact: 40},
		mentionToProgram: {detail: 16, compact: 10},
		row: {detail: 12, compact: 8},
		group: {detail: 30, compact: 18},
	},
} as const;

export const MENTION_WIDTH = TREE.width - TREE.mention.x;
export const PROGRAM_WIDTH = TREE.width - TREE.program.x;
export const DOMAIN_LABEL_WIDTH = TREE.width - 2 * TREE.domain.padX - TREE.domain.iconSize - TREE.domain.iconGap;
export const MENTION_LABEL_WIDTH = MENTION_WIDTH - TREE.mention.padLeft - TREE.mention.padRight;

/** Hauteur réservée à la vignette illustrée au-dessus de chaque carte domaine. */
export const VIGNETTE_HEIGHT = 300;
