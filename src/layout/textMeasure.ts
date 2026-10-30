/**
 * Mesure du texte avec les vraies polices (canvas), pour calculer la hauteur
 * des cartes de façon déterministe. À n'appeler qu'une fois les polices
 * chargées (voir FontGate).
 */
export interface TextStyle {
	readonly family: string;
	readonly weight: number;
	readonly size: number;
}

let context: CanvasRenderingContext2D | null = null;
const cache = new Map<string, number>();

const getContext = (): CanvasRenderingContext2D => {
	if (!context) {
		context = document.createElement('canvas').getContext('2d');
	}
	if (!context) {
		throw new Error('Canvas 2D indisponible : impossible de mesurer le texte.');
	}
	return context;
};

export const measureTextWidth = (text: string, style: TextStyle): number => {
	const font = `${style.weight} ${style.size}px ${style.family}`;
	const key = `${font}|${text}`;
	const cached = cache.get(key);
	if (cached !== undefined) {
		return cached;
	}
	const ctx = getContext();
	ctx.font = font;
	const width = ctx.measureText(text).width;
	cache.set(key, width);
	return width;
};

/**
 * Nombre de lignes d'un texte coupé aux espaces (algorithme glouton du navigateur).
 * Légèrement prudent : le navigateur peut aussi couper après un trait d'union.
 */
export const countLines = (text: string, style: TextStyle, maxWidth: number): number => {
	const words = text.split(/\s+/).filter(Boolean);
	const space = measureTextWidth(' ', style);
	let lines = 1;
	let current = 0;
	for (const word of words) {
		const width = measureTextWidth(word, style);
		if (current === 0) {
			current = width;
		} else if (current + space + width <= maxWidth) {
			current += space + width;
		} else {
			lines += 1;
			current = width;
		}
	}
	return lines;
};
