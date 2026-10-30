import type {FC, ReactNode} from 'react';
import {shade} from '../characters/looks';

/**
 * Objets illustrés (groupes SVG), même langage que les personnages : aplats,
 * formes arrondies, ombres internes par assombrissement. Origine : bas-centre.
 */
interface ObjectProps {
	readonly x: number;
	readonly y: number;
	readonly s?: number;
	readonly color: string;
	readonly accent?: string;
}

const Place: FC<{x: number; y: number; s: number; children: ReactNode}> = ({x, y, s, children}) => (
	<g transform={`translate(${x} ${y}) scale(${s})`}>{children}</g>
);

export const Globe: FC<ObjectProps> = ({x, y, s = 1, color, accent = '#FFFFFF'}) => (
	<Place x={x} y={y} s={s}>
		<ellipse cx={0} cy={-6} rx={46} ry={9} fill={shade(color, 0.35)} />
		<rect x={-8} y={-40} width={16} height={34} rx={6} fill={shade(color, 0.3)} />
		<path d="M -72 -110 A 74 74 0 0 0 64 -60" stroke={shade(color, 0.3)} strokeWidth={8} fill="none" strokeLinecap="round" />
		<circle cx={-4} cy={-118} r={62} fill={color} />
		<g fill={accent} opacity={0.85}>
			<path d="M -40 -150 Q -18 -164 4 -150 Q 14 -136 -6 -128 Q -26 -120 -40 -134 Z" />
			<path d="M 10 -112 Q 36 -118 44 -96 Q 34 -76 14 -82 Q 2 -94 10 -112 Z" />
			<path d="M -50 -100 Q -36 -96 -34 -82 Q -44 -74 -54 -84 Z" />
		</g>
		<g stroke={shade(color, 0.22)} strokeWidth={3} fill="none" opacity={0.6}>
			<ellipse cx={-4} cy={-118} rx={26} ry={62} />
			<line x1={-66} y1={-118} x2={58} y2={-118} />
		</g>
	</Place>
);

export const BookStack: FC<ObjectProps> = ({x, y, s = 1, color, accent = '#F0A01A'}) => (
	<Place x={x} y={y} s={s}>
		{[
			{w: 132, h: 28, c: color, dx: 0},
			{w: 118, h: 24, c: accent, dx: 8},
			{w: 124, h: 26, c: shade(color, -0.35), dx: -6},
		].map((b, i) => {
			const top = -(i + 1) * 28 - i * 2;
			return (
				<g key={b.c + i}>
					<rect x={-b.w / 2 + b.dx} y={top} width={b.w} height={b.h} rx={5} fill={b.c} />
					<rect x={-b.w / 2 + b.dx + 8} y={top + 5} width={b.w - 22} height={b.h - 10} rx={3} fill="#FFFFFF" opacity={0.9} />
					<rect x={b.w / 2 + b.dx - 16} y={top} width={9} height={b.h} fill={shade(b.c, 0.2)} />
				</g>
			);
		})}
	</Place>
);

export const MapSheet: FC<ObjectProps> = ({x, y, s = 1, color, accent = '#F0A01A'}) => (
	<Place x={x} y={y} s={s}>
		<path d="M -90 -10 L -90 -110 L -30 -124 L 30 -110 L 90 -124 L 90 -24 L 30 -10 L -30 -24 Z" fill="#FFFFFF" />
		<path d="M -30 -124 L -30 -24 L 30 -10 L 30 -110 Z" fill={shade('#FFFFFF', 0.06)} />
		<path d="M -72 -40 Q -40 -90 -6 -66 T 64 -92" stroke={color} strokeWidth={5} strokeDasharray="10 9" fill="none" strokeLinecap="round" />
		<path d="M 64 -122 Q 82 -122 82 -104 Q 82 -92 64 -76 Q 46 -92 46 -104 Q 46 -122 64 -122 Z" fill={accent} />
		<circle cx={64} cy={-105} r={6} fill="#FFFFFF" />
	</Place>
);

export const Microscope: FC<ObjectProps> = ({x, y, s = 1, color}) => (
	<Place x={x} y={y} s={s}>
		<rect x={-58} y={-22} width={116} height={22} rx={9} fill={shade(color, 0.3)} />
		<path d="M 18 -24 Q 46 -70 22 -128" stroke={shade(color, 0.15)} strokeWidth={22} fill="none" strokeLinecap="round" />
		<rect x={-34} y={-64} width={70} height={12} rx={6} fill={shade(color, 0.35)} />
		<g transform="rotate(-24 -6 -130)">
			<rect x={-22} y={-178} width={34} height={92} rx={12} fill={color} />
			<rect x={-16} y={-196} width={22} height={24} rx={6} fill={shade(color, 0.25)} />
			<rect x={-12} y={-90} width={14} height={20} rx={4} fill={shade(color, 0.35)} />
		</g>
	</Place>
);

export const Seedling: FC<ObjectProps> = ({x, y, s = 1, color, accent = '#C97B4A'}) => (
	<Place x={x} y={y} s={s}>
		<path d="M -40 -64 L 40 -64 L 30 0 L -30 0 Z" fill={accent} />
		<rect x={-46} y={-76} width={92} height={16} rx={6} fill={shade(accent, 0.12)} />
		<path d="M 0 -76 Q -4 -120 2 -150" stroke={shade(color, 0.2)} strokeWidth={6} fill="none" strokeLinecap="round" />
		<path d="M 0 -118 Q -56 -132 -62 -176 Q -12 -170 0 -118 Z" fill={color} />
		<path d="M 2 -136 Q 56 -150 64 -196 Q 12 -192 2 -136 Z" fill={shade(color, -0.2)} />
		<path d="M 2 -150 Q -6 -186 16 -208 Q 26 -176 2 -150 Z" fill={shade(color, 0.12)} />
	</Place>
);

export const Flask: FC<ObjectProps> = ({x, y, s = 1, color}) => (
	<Place x={x} y={y} s={s}>
		<path d="M -14 -120 L 14 -120 L 14 -78 L 48 -10 Q 52 0 40 0 L -40 0 Q -52 0 -48 -10 L -14 -78 Z" fill="#FFFFFF" opacity={0.92} />
		<path d="M -32 -36 L 32 -36 L 46 -8 Q 48 0 40 0 L -40 0 Q -48 0 -46 -8 Z" fill={color} />
		<rect x={-20} y={-128} width={40} height={12} rx={5} fill={shade('#FFFFFF', 0.12)} />
		<circle cx={-8} cy={-20} r={5} fill="#FFFFFF" opacity={0.7} />
		<circle cx={12} cy={-26} r={3.5} fill="#FFFFFF" opacity={0.7} />
	</Place>
);

export const Institution: FC<ObjectProps> = ({x, y, s = 1, color}) => (
	<Place x={x} y={y} s={s}>
		<rect x={-110} y={-18} width={220} height={18} rx={4} fill={shade(color, 0.25)} />
		<rect x={-96} y={-30} width={192} height={14} rx={3} fill={shade(color, 0.12)} />
		{[-72, -24, 24, 72].map((cx) => (
			<rect key={cx} x={cx - 13} y={-124} width={26} height={96} rx={4} fill={color} />
		))}
		<rect x={-100} y={-138} width={200} height={16} rx={3} fill={shade(color, 0.12)} />
		<path d="M -112 -138 L 0 -196 L 112 -138 Z" fill={shade(color, 0.2)} />
		<circle cx={0} cy={-158} r={9} fill="#FFFFFF" opacity={0.8} />
	</Place>
);

export const BarChart: FC<ObjectProps> = ({x, y, s = 1, color, accent = '#1E8BE3'}) => (
	<Place x={x} y={y} s={s}>
		<rect x={-84} y={-150} width={168} height={150} rx={14} fill="#FFFFFF" />
		{[34, 62, 48, 86].map((h, i) => (
			<rect key={h} x={-62 + i * 34} y={-20 - h} width={22} height={h} rx={5} fill={i === 3 ? color : shade(color, -0.45)} />
		))}
		<path d="M -58 -70 L -24 -96 L 10 -84 L 50 -124" stroke={accent} strokeWidth={5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
		<circle cx={50} cy={-124} r={7} fill={accent} />
	</Place>
);

export const Scales: FC<ObjectProps> = ({x, y, s = 1, color}) => (
	<Place x={x} y={y} s={s}>
		<rect x={-40} y={-12} width={80} height={12} rx={6} fill={shade(color, 0.3)} />
		<rect x={-5} y={-150} width={10} height={140} rx={5} fill={shade(color, 0.2)} />
		<rect x={-76} y={-146} width={152} height={8} rx={4} fill={color} />
		<circle cx={0} cy={-154} r={10} fill={color} />
		{[-66, 66].map((cx) => (
			<g key={cx}>
				<path d={`M ${cx} -140 L ${cx - 22} -84 M ${cx} -140 L ${cx + 22} -84`} stroke={shade(color, 0.2)} strokeWidth={3} />
				<path d={`M ${cx - 32} -86 Q ${cx} -60 ${cx + 32} -86 Z`} fill={color} />
			</g>
		))}
	</Place>
);

export const Theodolite: FC<ObjectProps> = ({x, y, s = 1, color, accent = '#F2B233'}) => (
	<Place x={x} y={y} s={s}>
		<g stroke={shade(color, 0.3)} strokeWidth={8} strokeLinecap="round">
			<line x1={0} y1={-130} x2={-54} y2={0} />
			<line x1={0} y1={-130} x2={54} y2={0} />
			<line x1={0} y1={-130} x2={6} y2={0} />
		</g>
		<rect x={-26} y={-150} width={52} height={22} rx={6} fill={shade(color, 0.2)} />
		<rect x={-20} y={-196} width={40} height={48} rx={10} fill={accent} />
		<rect x={-40} y={-188} width={80} height={20} rx={10} fill={color} />
		<circle cx={40} cy={-178} r={8} fill="#FFFFFF" />
	</Place>
);

export const Strata: FC<ObjectProps> = ({x, y, s = 1, color}) => (
	<Place x={x} y={y} s={s}>
		{[0, 1, 2, 3].map((i) => (
			<path
				key={i}
				d={`M -110 ${-i * 30} L -110 ${-(i + 1) * 30 + 6} Q -60 ${-(i + 1) * 30 - 8 + (i % 2) * 10} 0 ${-(i + 1) * 30 + 4} T 110 ${-(i + 1) * 30} L 110 ${-i * 30} Z`}
				fill={shade(color, [-0.55, -0.3, -0.05, 0.18][i] ?? 0)}
			/>
		))}
		<path d="M -40 -122 L -20 -150 L 2 -122 Z" fill={shade(color, 0.3)} />
	</Place>
);

export const Blueprint: FC<ObjectProps> = ({x, y, s = 1, color}) => (
	<Place x={x} y={y} s={s}>
		<rect x={-96} y={-120} width={192} height={120} rx={8} fill={color} />
		<g stroke="#FFFFFF" strokeWidth={1.5} opacity={0.35}>
			{[-72, -48, -24, 0, 24, 48, 72].map((gx) => (
				<line key={gx} x1={gx} y1={-112} x2={gx} y2={-8} />
			))}
			{[-96, -72, -48, -24].map((gy) => (
				<line key={gy} x1={-88} y1={gy} x2={88} y2={gy} />
			))}
		</g>
		<path d="M -60 -30 L -60 -88 L 20 -88 L 20 -56 L 62 -56 L 62 -30 Z" stroke="#FFFFFF" strokeWidth={4} fill="none" strokeLinejoin="round" />
		<circle cx={-20} cy={-58} r={10} stroke="#FFFFFF" strokeWidth={3} fill="none" />
	</Place>
);

export const Gear: FC<ObjectProps> = ({x, y, s = 1, color}) => (
	<Place x={x} y={y} s={s}>
		<g transform="translate(0 -60)">
			{Array.from({length: 8}, (_, i) => (
				<rect key={i} x={-10} y={-62} width={20} height={26} rx={4} fill={color} transform={`rotate(${i * 45})`} />
			))}
			<circle r={44} fill={color} />
			<circle r={18} fill="#FFFFFF" opacity={0.9} />
		</g>
	</Place>
);

/** Tableau numérique (scène des enseignants). */
export const DigitalBoard: FC<ObjectProps & {readonly width: number; readonly height: number; readonly children?: ReactNode}> = ({
	x,
	y,
	s = 1,
	color,
	width,
	height,
	children,
}) => (
	<Place x={x} y={y} s={s}>
		<rect x={-12} y={-90} width={24} height={90} rx={6} fill={shade(color, 0.2)} />
		<rect x={-120} y={-12} width={240} height={12} rx={6} fill={shade(color, 0.25)} />
		<rect x={-width / 2 - 14} y={-90 - height - 14} width={width + 28} height={height + 28} rx={26} fill={shade(color, 0.15)} />
		<rect x={-width / 2} y={-90 - height} width={width} height={height} rx={16} fill={color} />
		<g transform={`translate(${-width / 2} ${-90 - height})`}>{children}</g>
	</Place>
);

/** Bureau vu de face (masque le bas du corps des étudiants assis). */
export const Desk: FC<ObjectProps & {readonly width: number}> = ({x, y, s = 1, color, width}) => (
	<Place x={x} y={y} s={s}>
		<rect x={-width / 2 + 20} y={-170} width={18} height={170} rx={6} fill={shade(color, 0.3)} />
		<rect x={width / 2 - 38} y={-170} width={18} height={170} rx={6} fill={shade(color, 0.3)} />
		<rect x={-width / 2} y={-190} width={width} height={26} rx={10} fill={color} />
		<rect x={-width / 2 + 12} y={-166} width={width - 24} height={70} rx={10} fill={shade(color, 0.12)} />
	</Place>
);

export const Laptop: FC<ObjectProps> = ({x, y, s = 1, color}) => (
	<Place x={x} y={y} s={s}>
		<path d="M -56 -66 L 50 -66 L 44 -8 L -50 -8 Z" fill="#202838" transform="skewX(-8)" />
		<path d="M -50 -60 L 44 -60 L 39 -14 L -45 -14 Z" fill={color} transform="skewX(-8)" />
		<rect x={-70} y={-8} width={140} height={10} rx={5} fill="#C9D1DF" />
	</Place>
);
