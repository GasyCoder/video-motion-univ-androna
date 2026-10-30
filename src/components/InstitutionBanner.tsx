import {Landmark} from 'lucide-react';
import type {FC} from 'react';
import type {Point, Rect} from '../layout/geometry';
import {NAVY} from '../theme/colors';
import type {LockupMetrics} from '../theme/lockup';
import {BANNER, bannerContentHeight, lockupHeight} from '../theme/lockup';
import {SpectrumLine} from './SpectrumLine';
import {TitleLockup} from './TitleLockup';

interface InstitutionBannerProps {
	/** Panneau bleu institutionnel (plein écran → bandeau → racine). */
	readonly rect: Rect;
	readonly radius: number;
	/** Échelle des éléments décoratifs (icônes, ligne d'accent). */
	readonly scale: number;
	readonly metrics: LockupMetrics;
	/** Centre du groupe titre + ligne d'accent. */
	readonly contentCenter: Point;
	readonly lineProgress: readonly number[];
	readonly subtitleProgress: number;
	readonly subtitleOpacity?: number;
	readonly accentProgress: number;
	readonly iconOpacity: number;
	readonly shadow?: number;
}

/**
 * Bandeau institutionnel « Université d'Androna », repris de l'en-tête de
 * l'organigramme original. Le même composant sert d'écran d'ouverture,
 * de bandeau, de racine de l'organigramme et d'écran de fin.
 */
export const InstitutionBanner: FC<InstitutionBannerProps> = ({
	rect,
	radius,
	scale,
	metrics,
	contentCenter,
	lineProgress,
	subtitleProgress,
	subtitleOpacity = 1,
	accentProgress,
	iconOpacity,
	shadow = 1,
}) => {
	const contentHeight = bannerContentHeight(metrics, scale);
	const lockupCenter: Point = {
		x: contentCenter.x,
		y: contentCenter.y - contentHeight / 2 + lockupHeight(metrics) / 2,
	};
	const accentTop = contentCenter.y + contentHeight / 2 - BANNER.accentHeight * scale;
	const iconSize = BANNER.iconSize * scale;
	const iconY = rect.y + rect.height / 2 - iconSize / 2;

	return (
		<>
			<div
				style={{
					position: 'absolute',
					left: rect.x,
					top: rect.y,
					width: rect.width,
					height: rect.height,
					borderRadius: radius,
					overflow: 'hidden',
					background: `radial-gradient(130% 90% at 50% 0%, ${NAVY.bright} 0%, ${NAVY.base} 42%, ${NAVY.deep} 78%, ${NAVY.deepest} 100%)`,
					boxShadow: `0 ${40 * scale}px ${90 * scale}px -${30 * scale}px rgba(6, 36, 90, ${0.55 * shadow})`,
				}}
			>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						backgroundImage:
							'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
						backgroundSize: `${72 * scale}px ${72 * scale}px`,
						backgroundPosition: 'center center',
						maskImage: 'radial-gradient(70% 70% at 50% 40%, black, transparent)',
					}}
				/>
				<div
					style={{
						position: 'absolute',
						inset: 0,
						borderRadius: radius,
						boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.22), inset 0 0 0 1px rgba(255,255,255,0.07)',
					}}
				/>
			</div>
			{iconOpacity > 0
				? [rect.x + BANNER.iconInset * scale, rect.x + rect.width - BANNER.iconInset * scale].map((cx) => (
						<Landmark
							key={cx}
							size={iconSize}
							color="#FFFFFF"
							strokeWidth={1.6}
							style={{position: 'absolute', left: cx - iconSize / 2, top: iconY, opacity: iconOpacity * 0.9}}
						/>
					))
				: null}
			<TitleLockup
				metrics={metrics}
				center={lockupCenter}
				lineProgress={lineProgress}
				subtitleProgress={subtitleProgress}
				subtitleOpacity={subtitleOpacity}
			/>
			<SpectrumLine
				width={BANNER.accentWidth * scale}
				height={BANNER.accentHeight * scale}
				progress={accentProgress}
				style={{position: 'absolute', left: contentCenter.x - (BANNER.accentWidth * scale) / 2, top: accentTop}}
			/>
		</>
	);
};
