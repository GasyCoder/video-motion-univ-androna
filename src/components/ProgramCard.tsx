import type {FC} from 'react';
import {interpolate} from 'remotion';
import type {Program} from '../data/academicStructure';
import type {Rect} from '../layout/geometry';
import {TREE} from '../layout/metrics';
import {INK, SHADOW} from '../theme/colors';
import type {DomainTheme} from '../theme/domainThemes';
import {FONT_STACK} from '../theme/fonts';

interface ProgramCardProps {
	readonly program: Program;
	readonly theme: DomainTheme;
	readonly rect: Rect;
	/** Largeur commune de la colonne des acronymes du domaine. */
	readonly codeColumn: number;
	/** Ouverture de l'espace (masque vertical). */
	readonly expansion: number;
	/** Apparition (ressort, 0 → 1). */
	readonly reveal: number;
	readonly lod: number;
}

const {program: P} = TREE;

export const ProgramCard: FC<ProgramCardProps> = ({program, theme, rect, codeColumn, expansion, reveal, lod}) => {
	if (expansion <= 0 || reveal <= 0) {
		return null;
	}
	const p = Math.min(1, reveal);
	const labelOpacity =
		interpolate(lod, [0, 0.4], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}) *
		interpolate(reveal, [0.35, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});

	return (
		<div
			style={{
				position: 'absolute',
				left: rect.x,
				top: rect.y,
				width: rect.width,
				height: rect.height,
				// Révélation par masque, synchronisée avec l'ouverture de l'espace.
				clipPath: `inset(-30px -30px ${(1 - expansion) * 100}% -30px)`,
				opacity: Math.min(1, reveal * 1.5),
				filter: p < 0.98 ? `blur(${(1 - p) * 6}px)` : undefined,
				transform: `translateX(${(1 - reveal) * -40}px)`,
			}}
		>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: P.radius,
					background: theme.tint,
					boxShadow: `inset 0 0 0 2px ${theme.soft}, ${SHADOW.soft}`,
					padding: `0 ${P.padX}px`,
					display: 'flex',
					alignItems: 'center',
					gap: P.columnGap,
				}}
			>
				<div
					style={{
						width: codeColumn,
						flexShrink: 0,
						fontFamily: FONT_STACK.display,
						fontWeight: P.code.weight,
						fontSize: P.code.size,
						lineHeight: P.codeLineHeight,
						color: theme.deep,
						whiteSpace: 'nowrap',
					}}
				>
					{program.code}
				</div>
				<div
					style={{
						fontFamily: FONT_STACK.text,
						fontWeight: P.label.weight,
						fontSize: P.label.size,
						lineHeight: P.labelLineHeight,
						color: INK.strong,
						opacity: labelOpacity,
						textWrap: 'balance',
					}}
				>
					{program.label}
				</div>
			</div>
		</div>
	);
};
