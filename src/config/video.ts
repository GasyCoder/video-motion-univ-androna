/** Format de diffusion : Reels / TikTok, 9:16. */
export const VIDEO = {
	width: 1080,
	height: 1920,
	fps: 30,
} as const;

/**
 * Marges réservées aux interfaces Facebook / Instagram / TikTok
 * (onglets en haut, légende et pseudo en bas, boutons d'action à droite).
 * Aucun texte essentiel n'est placé en dehors de SAFE_RECT.
 */
export const SAFE_AREA = {
	top: 240,
	bottom: 460,
	left: 84,
	right: 140,
} as const;

export const SAFE_RECT = {
	x: SAFE_AREA.left,
	y: SAFE_AREA.top,
	width: VIDEO.width - SAFE_AREA.left - SAFE_AREA.right,
	height: VIDEO.height - SAFE_AREA.top - SAFE_AREA.bottom,
} as const;

/** Point de l'écran sur lequel la caméra centre sa cible : centre de la zone sûre. */
export const FOCUS = {
	x: SAFE_RECT.x + SAFE_RECT.width / 2,
	y: SAFE_RECT.y + SAFE_RECT.height / 2,
} as const;

/** Bande des sous-titres : au-dessus des légendes des plateformes, dans la zone sûre. */
export const SUBTITLE_BAND = {
	centerY: 1350,
	maxWidth: SAFE_RECT.width,
} as const;
