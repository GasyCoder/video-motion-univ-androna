import type {DomainPlan, MentionPlan, ProgramPlan} from '../timeline/timeline';
import {DOMAIN_PLANS} from '../timeline/timeline';
import {DOMAIN_LABEL_WIDTH, MENTION_LABEL_WIDTH, PROGRAM_WIDTH, TREE} from './metrics';
import {countLines, measureTextWidth} from './textMeasure';

/** Marge de sécurité sur la largeur disponible lors du calcul des retours à la ligne. */
const WRAP_SAFETY = 6;

export interface MeasuredProgram {
	readonly plan: ProgramPlan;
	readonly labelLines: number;
	readonly height: number;
}

export interface MeasuredMention {
	readonly plan: MentionPlan;
	/** Acronyme et intitulé sur la même ligne (comme « HIST : Histoire » dans l'original). */
	readonly inline: boolean;
	readonly labelLines: number;
	readonly height: number;
	readonly compactHeight: number;
	readonly programs: readonly MeasuredProgram[];
}

export interface MeasuredDomain {
	readonly plan: DomainPlan;
	readonly labelLines: number;
	readonly cardHeight: number;
	/** Largeur de la colonne des acronymes de parcours (alignés pour tout le domaine). */
	readonly codeColumn: number;
	readonly programLabelWidth: number;
	readonly mentions: readonly MeasuredMention[];
}

const measureDomain = (plan: DomainPlan): MeasuredDomain => {
	const {domain: d, mention: m, program: p} = TREE;

	const codeColumn = Math.ceil(
		Math.max(...plan.mentions.flatMap((mp) => mp.programs.map((pp) => measureTextWidth(pp.program.code, p.code)))) + 4,
	);
	const programLabelWidth = PROGRAM_WIDTH - 2 * p.padX - codeColumn - p.columnGap;

	const labelLines = countLines(plan.domain.label, d.label, DOMAIN_LABEL_WIDTH - WRAP_SAFETY);
	const cardHeight =
		2 * d.padY + d.code.size * d.codeLineHeight + d.codeLabelGap + labelLines * d.label.size * d.labelLineHeight;

	// Disposition commune à tout le domaine : en ligne seulement si chaque mention tient sur une ligne.
	const inline = plan.mentions.every(
		(mp) =>
			measureTextWidth(mp.mention.code, m.code) + m.inlineGap + measureTextWidth(mp.mention.label, m.label) <=
			MENTION_LABEL_WIDTH - WRAP_SAFETY,
	);
	const codeHeight = m.code.size * m.codeLineHeight;

	const mentions = plan.mentions.map((mp): MeasuredMention => {
		const mentionLines = inline ? 1 : countLines(mp.mention.label, m.label, MENTION_LABEL_WIDTH - WRAP_SAFETY);
		const programs = mp.programs.map((pp): MeasuredProgram => {
			const lines = countLines(pp.program.label, p.label, programLabelWidth - WRAP_SAFETY);
			const content = Math.max(p.code.size * p.codeLineHeight, lines * p.label.size * p.labelLineHeight);
			return {plan: pp, labelLines: lines, height: 2 * p.padY + content};
		});
		return {
			plan: mp,
			inline,
			labelLines: mentionLines,
			height: inline
				? 2 * m.padY + codeHeight
				: 2 * m.padY + codeHeight + m.codeLabelGap + mentionLines * m.label.size * m.labelLineHeight,
			compactHeight: 2 * m.compactPadY + codeHeight,
			programs,
		};
	});

	return {plan, labelLines, cardHeight, codeColumn, programLabelWidth, mentions};
};

let measured: readonly MeasuredDomain[] | null = null;

/** Mesure unique de toute la structure (après chargement des polices). */
export const getMeasuredStructure = (): readonly MeasuredDomain[] => {
	if (!measured) {
		measured = DOMAIN_PLANS.map(measureDomain);
	}
	return measured;
};
