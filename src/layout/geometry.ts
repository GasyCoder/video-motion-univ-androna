export interface Point {
	readonly x: number;
	readonly y: number;
}

export interface Rect {
	readonly x: number;
	readonly y: number;
	readonly width: number;
	readonly height: number;
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;

export const clamp = (value: number, min = 0, max = 1): number => Math.min(max, Math.max(min, value));

export const lerpRect = (a: Rect, b: Rect, t: number): Rect => ({
	x: lerp(a.x, b.x, t),
	y: lerp(a.y, b.y, t),
	width: lerp(a.width, b.width, t),
	height: lerp(a.height, b.height, t),
});

export const unionRect = (a: Rect, b: Rect): Rect => {
	const x = Math.min(a.x, b.x);
	const y = Math.min(a.y, b.y);
	return {
		x,
		y,
		width: Math.max(a.x + a.width, b.x + b.width) - x,
		height: Math.max(a.y + a.height, b.y + b.height) - y,
	};
};

/**
 * Coude orthogonal arrondi : descend verticalement depuis `from`,
 * puis rejoint horizontalement `to` (connecteur parent → enfant).
 */
export const elbowPath = (from: Point, to: Point, radius: number): string => {
	const dx = to.x - from.x;
	const dy = to.y - from.y;
	const r = Math.max(0, Math.min(radius, Math.abs(dx), Math.abs(dy)));
	const dir = Math.sign(dx) || 1;
	if (r === 0) {
		return `M ${from.x} ${from.y} V ${to.y} H ${to.x}`;
	}
	return [
		`M ${from.x} ${from.y}`,
		`V ${to.y - r}`,
		`Q ${from.x} ${to.y} ${from.x + dir * r} ${to.y}`,
		`H ${to.x}`,
	].join(' ');
};
