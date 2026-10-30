import {FOCUS, SAFE_RECT} from '../config/video';
import type {Point, Rect} from '../layout/geometry';
import {lerp, unionRect} from '../layout/geometry';
import {TREE} from '../layout/metrics';
import type {WorldLayout} from '../layout/worldLayout';

/**
 * Caméra 2D : le point monde (x, y) est affiché au point FOCUS de l'écran,
 * avec le facteur de zoom donné.
 */
export interface Camera {
	readonly x: number;
	readonly y: number;
	readonly zoom: number;
}

/** Interpolation de caméra : position linéaire, zoom géométrique (perçu comme régulier). */
export const mixCamera = (a: Camera, b: Camera, t: number): Camera => ({
	x: lerp(a.x, b.x, t),
	y: lerp(a.y, b.y, t),
	zoom: a.zoom * Math.pow(b.zoom / a.zoom, t),
});

export const withZoom = (camera: Camera, factor: number): Camera => ({...camera, zoom: camera.zoom * factor});

export const worldToScreen = (camera: Camera, p: Point): Point => ({
	x: (p.x - camera.x) * camera.zoom + FOCUS.x,
	y: (p.y - camera.y) * camera.zoom + FOCUS.y,
});

export const rectToScreen = (camera: Camera, r: Rect): Rect => {
	const topLeft = worldToScreen(camera, r);
	return {x: topLeft.x, y: topLeft.y, width: r.width * camera.zoom, height: r.height * camera.zoom};
};

// ---------------------------------------------------------------------------
// Cadrages : fonctions de la mise en page courante
// ---------------------------------------------------------------------------

/** Ordonnées écran visées pour le haut (vignette) et le bas d'un arbre en vue détaillée. */
const DETAIL_TOP_ON_SCREEN = 262;
const DETAIL_BOTTOM_ON_SCREEN = 1430;

const slotOf = (layout: WorldLayout, index: number) => {
	const slot = layout.slots[index];
	if (!slot) {
		throw new Error(`Domaine ${index} absent de la mise en page`);
	}
	return slot;
};

/** Haut de l'arbre : vignette illustrée, carte domaine et premières mentions. */
export const domainTopFraming = (layout: WorldLayout, index: number): Camera => {
	const slot = slotOf(layout, index);
	return {
		x: slot.origin.x + TREE.width / 2,
		y: slot.vignetteTop + (FOCUS.y - DETAIL_TOP_ON_SCREEN),
		zoom: 1,
	};
};

/** Bas de l'arbre entièrement construit (identique au haut si l'arbre tient à l'écran). */
export const domainBottomFraming = (layout: WorldLayout, index: number): Camera => {
	const slot = slotOf(layout, index);
	const top = domainTopFraming(layout, index);
	const bottomY = slot.origin.y + slot.fullHeight - (DETAIL_BOTTOM_ON_SCREEN - FOCUS.y);
	return {...top, y: Math.max(top.y, bottomY)};
};

/** Zone écran de la pause : au-dessus de la bande de sous-titres. */
const REST_TOP_ON_SCREEN = 262;
const REST_BOTTOM_ON_SCREEN = 1280;
/** En dessous, les descriptions deviendraient trop petites sur téléphone. */
const REST_MIN_ZOOM = 0.72;

/**
 * Pause de lecture : la caméra recule pour montrer le domaine entier
 * (carte comprise), sans descendre sous un zoom lisible.
 */
export const domainRestFraming = (layout: WorldLayout, index: number, holdZoom: number): Camera => {
	const slot = slotOf(layout, index);
	const fit = (REST_BOTTOM_ON_SCREEN - REST_TOP_ON_SCREEN) / slot.fullHeight;
	const zoom = Math.max(REST_MIN_ZOOM, Math.min(1, fit)) * holdZoom;
	return {
		x: slot.origin.x + TREE.width / 2,
		y: slot.origin.y + slot.fullHeight - (REST_BOTTOM_ON_SCREEN - FOCUS.y) / zoom,
		zoom,
	};
};

/**
 * Vue d'ensemble : bandeau racine + grille complète, ajustés entre le haut de la
 * zone sûre et `bottom` (abaissé quand des personnages occupent le bas de l'écran).
 */
export const overviewFraming = (layout: WorldLayout, bottom: number = SAFE_RECT.y + SAFE_RECT.height - 24): Camera => {
	const bounds = unionRect(layout.root, layout.grid);
	const height = bottom - SAFE_RECT.y;
	const zoom = Math.min(SAFE_RECT.width / bounds.width, height / bounds.height);
	const center = {x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2};
	// Centre des bornes placé au milieu de [haut de la zone sûre, bottom].
	return {x: center.x, y: center.y - (SAFE_RECT.y + height / 2 - FOCUS.y) / zoom, zoom};
};

/** Bas de la vue d'ensemble quand la foule d'étudiants apparaît au premier plan. */
export const OVERVIEW_WITH_CROWD_BOTTOM = 1120;

/** Transformation CSS du conteneur monde. */
export const cameraTransform = (camera: Camera): string =>
	`translate(${FOCUS.x}px, ${FOCUS.y}px) scale(${camera.zoom}) translate(${-camera.x}px, ${-camera.y}px)`;
