import type {FC} from 'react';
import {interpolate} from 'remotion';
import type {Mention} from '../data/academicStructure';
import type {Rect} from '../layout/geometry';
import {lerp} from '../layout/geometry';
import {TREE} from '../layout/metrics';
import {INK, PAPER, SHADOW} from '../theme/colors';
import type {DomainTheme} from '../theme/domainThemes';
import {FONT_STACK} from '../theme/fonts';

interface MentionCardProps {
	readonly mention: Mention;
	readonly inline: boolean;
	readonly theme: DomainTheme;
	readonly rect: Rect;
	/** Apparition (ressort, 0 → 1). */
	readonly reveal: number;
	/** Niveau de détail : l'intitulé s'efface dans la vue d'ensemble. */
	readonly lod: number;
}

const {mention: M} = TREE;

export const MentionCard: FC<MentionCardProps> = ({mention, inline, theme, rect, reveal, lod}) => {
	if (reveal <= 0) {
		return null;
	}
	const p = Math.min(1, reveal);
	const accent = interpolate(reveal, [0.3, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const labelOpacity = interpolate(lod, [0, 0.45], [1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const padY = lerp(M.padY, M.compactPadY, lod);

	return (
		<div
			style={{
				position: 'absolute',
				left: rect.x,
				top: rect.y,
				width: rect.width,
				height: rect.height,
				borderRadius: M.radius,
				background: PAPER.card,
				boxShadow: SHADOW.card,
				overflow: 'hidden',
				opacity: Math.min(1, reveal * 1.5),
				filter: p < 0.98 ? `blur(${(1 - p) * 8}px)` : undefined,
				transformOrigin: '0% 50%',
				transform: `translateX(${(1 - reveal) * -48}px) scale(${lerp(0.95, 1, p)})`,
			}}
		>
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 0,
					bottom: 0,
					width: M.accentWidth,
					background: `linear-gradient(180deg, ${theme.primary}, ${theme.deep})`,
					transformOrigin: '50% 0%',
					transform: `scaleY(${accent})`,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					padding: `${padY}px ${M.padRight}px ${padY}px ${M.padLeft}px`,
					display: 'flex',
					// Vue compacte : l'intitulé s'efface et sort par le bas (rogné par la carte).
					flexDirection: inline ? 'row' : 'column',
					alignItems: inline ? 'baseline' : 'stretch',
					gap: inline ? M.inlineGap : M.codeLabelGap,
				}}
			>
				<div
					style={{
						fontFamily: FONT_STACK.display,
						fontWeight: M.code.weight,
						fontSize: M.code.size,
						lineHeight: M.codeLineHeight,
						letterSpacing: '0.01em',
						color: theme.deep,
						flexShrink: 0,
					}}
				>
					{mention.code}
				</div>
				<div
					style={{
						fontFamily: FONT_STACK.text,
						fontWeight: M.label.weight,
						fontSize: M.label.size,
						lineHeight: M.labelLineHeight,
						color: INK.body,
						opacity: labelOpacity * interpolate(reveal, [0.4, 1], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'}),
						textWrap: 'balance',
					}}
				>
					{mention.label}
				</div>
			</div>
		</div>
	);
};
