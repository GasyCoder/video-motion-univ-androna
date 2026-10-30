import type {FC} from 'react';
import {UNIVERSITY} from '../data/academicStructure';
import type {Point} from '../layout/geometry';
import {FONT_STACK} from '../theme/fonts';
import type {LockupMetrics} from '../theme/lockup';
import {SUBTITLE_LINE_HEIGHT, TITLE_LINE_HEIGHT, lockupHeight} from '../theme/lockup';

interface TitleLockupProps {
	readonly metrics: LockupMetrics;
	/** Centre du bloc, dans le repère du parent. */
	readonly center: Point;
	/** Apparition de chaque ligne du titre (0 → 1). */
	readonly lineProgress: readonly number[];
	readonly subtitleProgress: number;
	readonly subtitleOpacity?: number;
	readonly color?: string;
}

/**
 * Titre de l'université. Chaque ligne sort d'un masque en montant,
 * passe du flou au net et resserre son interlettrage.
 */
export const TitleLockup: FC<TitleLockupProps> = ({
	metrics,
	center,
	lineProgress,
	subtitleProgress,
	subtitleOpacity = 1,
	color = '#FFFFFF',
}) => {
	const height = lockupHeight(metrics);
	const sub = Math.max(0, subtitleProgress);

	return (
		<div
			style={{
				position: 'absolute',
				left: center.x,
				top: center.y - height / 2,
				transform: 'translateX(-50%)',
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				color,
				whiteSpace: 'nowrap',
				textTransform: 'uppercase',
			}}
		>
			{UNIVERSITY.nameLines.map((line, i) => {
				const p = Math.max(0, lineProgress[i] ?? 1);
				const inv = 1 - Math.min(1, p);
				return (
					// Le masque déborde légèrement pour ne pas rogner les accents des capitales ;
					// les marges négatives conservent la hauteur de ligne prévue par la mise en page.
					<div
						key={line}
						style={{
							fontSize: metrics.titleSize,
							overflow: 'hidden',
							padding: '0.16em 0.3em',
							marginTop: i === 0 ? '-0.16em' : `calc(${metrics.lineGap}px - 0.16em)`,
							marginBottom: '-0.16em',
						}}
					>
						<div
							style={{
								fontFamily: FONT_STACK.display,
								fontWeight: 800,
								lineHeight: TITLE_LINE_HEIGHT,
								letterSpacing: `${metrics.titleTracking + inv * 0.18}em`,
								transform: `translateY(${inv * 110}%)`,
								filter: inv > 0.01 ? `blur(${inv * 10}px)` : undefined,
							}}
						>
							{line}
						</div>
					</div>
				);
			})}
			<div
				style={{
					marginTop: metrics.subtitleGap,
					fontFamily: FONT_STACK.display,
					fontWeight: 600,
					fontSize: metrics.subtitleSize,
					lineHeight: SUBTITLE_LINE_HEIGHT,
					letterSpacing: `${metrics.subtitleTracking + (1 - Math.min(1, sub)) * 0.3}em`,
					// Compense l'espace ajouté après la dernière lettre par l'interlettrage.
					marginRight: `-${metrics.subtitleTracking}em`,
					opacity: Math.min(1, sub) * subtitleOpacity * 0.82,
				}}
			>
				{UNIVERSITY.chartTitle}
			</div>
		</div>
	);
};
