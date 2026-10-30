import {LOCKUP, bannerContentHeight} from '../theme/lockup';
import type {Point, Rect} from './geometry';
import {elbowPath, lerp} from './geometry';
import type {MeasuredDomain} from './measure';
import {TREE, VIGNETTE_HEIGHT} from './metrics';
import {fullTreeHeight} from './treeLayout';

/**
 * Le « monde » : les quatre arbres disposés en grille 2 × 2 (ordre de lecture
 * de l'organigramme : ALSH, ST / SS, SI), surmontés du bandeau racine
 * « Université d'Androna ». La caméra se déplace dans ce plan.
 *
 * - `assemble` : 0 = arbres très espacés (scènes de détail, les voisins restent
 *   hors champ), 1 = arbres rassemblés pour la révélation finale.
 * - `lod` : niveau de détail transmis aux arbres.
 */
export const WORLD = {
	columns: 2,
	gapX: {detail: 560, assembled: 110},
	gapY: {detail: 420, assembled: 100},
	root: {
		width: 1500,
		padY: 70,
		gap: 150,
		radius: 64,
		iconSize: 132,
	},
} as const;

export const ROOT_HEIGHT = 2 * WORLD.root.padY + bannerContentHeight(LOCKUP.root, 1);

export interface WorldState {
	readonly lod: number;
	readonly assemble: number;
}

export interface TreeSlot {
	readonly measured: MeasuredDomain;
	/** Haut de la vignette illustrée (au-dessus de la carte domaine). */
	readonly vignetteTop: number;
	readonly origin: Point;
	readonly column: number;
	readonly fullHeight: number;
}

export interface SpineBranch {
	readonly slot: TreeSlot;
	readonly path: string;
	readonly target: Point;
}

export interface WorldLayout {
	readonly slots: readonly TreeSlot[];
	readonly grid: Rect;
	readonly root: Rect;
	readonly spine: readonly SpineBranch[];
}

export const layoutWorld = (measured: readonly MeasuredDomain[], state: WorldState): WorldLayout => {
	const gapX = lerp(WORLD.gapX.detail, WORLD.gapX.assembled, state.assemble);
	const gapY = lerp(WORLD.gapY.detail, WORLD.gapY.assembled, state.assemble);
	// La vignette se replie dans la vue d'ensemble : on retrouve alors la grille validée.
	const vignette = VIGNETTE_HEIGHT * (1 - state.lod);
	const heights = measured.map((m) => vignette + fullTreeHeight(m, state.lod));

	const rowCount = Math.ceil(measured.length / WORLD.columns);
	const rowHeights = Array.from({length: rowCount}, (_, row) =>
		Math.max(0, ...heights.slice(row * WORLD.columns, (row + 1) * WORLD.columns)),
	);
	const rowTops = rowHeights.map((_, row) => rowHeights.slice(0, row).reduce((sum, h) => sum + h + gapY, 0));

	const slots = measured.map((m, i): TreeSlot => {
		const column = i % WORLD.columns;
		const row = Math.floor(i / WORLD.columns);
		const top = rowTops[row] ?? 0;
		return {
			measured: m,
			column,
			vignetteTop: top,
			origin: {x: column * (TREE.width + gapX), y: top + vignette},
			fullHeight: (heights[i] ?? 0) - vignette,
		};
	});

	const gridWidth = WORLD.columns * TREE.width + (WORLD.columns - 1) * gapX;
	const gridHeight = rowHeights.reduce((sum, h) => sum + h, 0) + (rowCount - 1) * gapY;
	const grid: Rect = {x: 0, y: 0, width: gridWidth, height: gridHeight};
	const root: Rect = {
		x: gridWidth / 2 - WORLD.root.width / 2,
		y: -WORLD.root.gap - ROOT_HEIGHT,
		width: WORLD.root.width,
		height: ROOT_HEIGHT,
	};

	// Colonne vertébrale : du bandeau racine vers le bord intérieur de chaque carte domaine.
	const spineOrigin: Point = {x: gridWidth / 2, y: root.y + root.height - 30};
	const spine = slots.map((slot): SpineBranch => {
		const target: Point = {
			x: slot.column === 0 ? slot.origin.x + TREE.width : slot.origin.x,
			y: slot.origin.y + slot.measured.cardHeight / 2,
		};
		return {slot, target, path: elbowPath(spineOrigin, target, TREE.connectorRadius)};
	});

	return {slots, grid, root, spine};
};
