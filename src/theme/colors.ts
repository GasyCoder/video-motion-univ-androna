/** Couleurs institutionnelles (bleu du bandeau de l'organigramme original). */
export const NAVY = {
	deepest: '#041330',
	deep: '#06265A',
	base: '#0B3B88',
	bright: '#1A5FC4',
	highlight: '#4C8DF0',
} as const;

/** Encres pour le texte sur fond clair. */
export const INK = {
	strong: '#0D1B36',
	body: '#2E3D58',
	muted: '#6A7891',
	faint: '#9AA7BB',
} as const;

export const PAPER = {
	top: '#F8FAFD',
	bottom: '#EBF0F7',
	card: '#FFFFFF',
	dot: 'rgba(20, 48, 100, 0.11)',
} as const;

/** Ombres douces partagées : la profondeur vient de l'élévation, pas des contours. */
export const SHADOW = {
	card: '0 18px 40px -18px rgba(12, 36, 84, 0.28), 0 3px 8px rgba(12, 36, 84, 0.06)',
	soft: '0 10px 26px -14px rgba(12, 36, 84, 0.24), 0 2px 5px rgba(12, 36, 84, 0.05)',
} as const;

/** Convertit #RRGGBB en rgba() avec l'opacité donnée. */
export const withAlpha = (hex: string, alpha: number): string => {
	const value = hex.replace('#', '');
	const r = parseInt(value.slice(0, 2), 16);
	const g = parseInt(value.slice(2, 4), 16);
	const b = parseInt(value.slice(4, 6), 16);
	return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
