import type {ProgramPlan} from '../timeline/timeline';
import type {Point, Rect} from './geometry';
import {elbowPath, lerp} from './geometry';
import type {MeasuredDomain, MeasuredMention, MeasuredProgram} from './measure';
import {MENTION_WIDTH, PROGRAM_WIDTH, TREE} from './metrics';

/**
 * Mise en page d'un arbre Domaine → Mentions → Parcours (coordonnées locales).
 *
 * - `lod` (niveau de détail) : 0 = vue détaillée, 1 = vue d'ensemble compacte.
 * - `expansionOf` : ouverture de chaque parcours (0 = replié, 1 = ouvert).
 *   L'arbre grandit réellement à mesure que les parcours apparaissent.
 */

export interface ProgramNode {
	readonly measured: MeasuredProgram;
	readonly rect: Rect;
	readonly anchor: Point;
	readonly expansion: number;
	readonly connector: string;
}

export interface MentionNode {
	readonly measured: MeasuredMention;
	readonly rect: Rect;
	readonly anchor: Point;
	readonly connector: string;
	readonly programs: readonly ProgramNode[];
}

export interface TreeLayout {
	readonly measured: MeasuredDomain;
	readonly card: Rect;
	readonly mentions: readonly MentionNode[];
	readonly height: number;
}

type GapKey = keyof typeof TREE.gaps;

const FULLY_EXPANDED = (): number => 1;

export const layoutTree = (
	measured: MeasuredDomain,
	lod: number,
	expansionOf: (plan: ProgramPlan) => number = FULLY_EXPANDED,
): TreeLayout => {
	const gap = (key: GapKey): number => lerp(TREE.gaps[key].detail, TREE.gaps[key].compact, lod);
	const {mention: m, program: p} = TREE;

	const card: Rect = {x: 0, y: 0, width: TREE.width, height: measured.cardHeight};
	// Les tracés démarrent sous les cartes (dessinées par-dessus) pour sortir proprement du bord.
	const trunkOrigin: Point = {x: TREE.trunkX, y: card.height - 24};

	let y = card.height + gap('domainToMention');
	const lastMention = measured.mentions.length - 1;

	const mentions = measured.mentions.map((mm, i): MentionNode => {
		const height = lerp(mm.height, mm.compactHeight, lod);
		const rect: Rect = {x: m.x, y, width: MENTION_WIDTH, height};
		const codeCenter = m.padY + (m.code.size * m.codeLineHeight) / 2;
		const anchor: Point = {x: m.x, y: y + lerp(codeCenter, height / 2, lod)};
		const branchOrigin: Point = {x: m.x + m.branchInset, y: y + height - 14};
		y += height;

		const programs = mm.programs.map((pm, j): ProgramNode => {
			const expansion = expansionOf(pm.plan);
			const before = j === 0 ? gap('mentionToProgram') : gap('row');
			const rowHeight = lerp(pm.height, p.compactHeight, lod);
			const top = y + before * expansion;
			const programAnchor: Point = {x: p.x, y: top + rowHeight / 2};
			y += (before + rowHeight) * expansion;
			return {
				measured: pm,
				rect: {x: p.x, y: top, width: PROGRAM_WIDTH, height: rowHeight},
				anchor: programAnchor,
				expansion,
				connector: elbowPath(branchOrigin, programAnchor, TREE.connectorRadius),
			};
		});

		if (i < lastMention) {
			y += gap('group');
		}

		return {
			measured: mm,
			rect,
			anchor,
			connector: elbowPath(trunkOrigin, anchor, TREE.connectorRadius),
			programs,
		};
	});

	return {measured, card, mentions, height: y};
};

/** Hauteur de l'arbre entièrement construit (cadrages caméra, grille du monde). */
export const fullTreeHeight = (measured: MeasuredDomain, lod: number): number => layoutTree(measured, lod).height;
