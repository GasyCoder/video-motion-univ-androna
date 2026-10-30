import type {FC} from 'react';
import {interpolate} from 'remotion';
import {pulse, ramp, springAt} from '../animation/progress';
import {DOMAIN_TAG} from '../config/copy';
import type {Domain} from '../data/academicStructure';
import {lerp} from '../layout/geometry';
import {TREE} from '../layout/metrics';
import {withAlpha} from '../theme/colors';
import type {DomainTheme} from '../theme/domainThemes';
import {FONT_STACK} from '../theme/fonts';
import {EASE, SPRINGS} from '../theme/motion';
import type {CardEntrance} from '../timeline/choreography';

interface DomainCardProps {
	readonly domain: Domain;
	readonly theme: DomainTheme;
	readonly index: number;
	readonly height: number;
	readonly frame: number;
	/** Image de début d'entrée de la carte. */
	readonly startAt: number;
	readonly entrance: CardEntrance;
	/** 0 → 1 : mise en valeur dans la vue d'ensemble. */
	readonly highlight: number;
}

const {domain: D} = TREE;

/** Grande carte d'un domaine : acronyme fort, intitulé complet, icône. */
export const DomainCard: FC<DomainCardProps> = ({domain, theme, index, height, frame, startAt, entrance, highlight}) => {
	const t = frame - startAt;
	const s = springAt(frame, startAt, SPRINGS.card);
	const settle = Math.min(1, s);
	const opacity = interpolate(t, [0, 8], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const blur = interpolate(s, [0, 0.85], [14, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
	const icon = springAt(frame, startAt + 10, SPRINGS.pop);
	const label = springAt(frame, startAt + 16, SPRINGS.text);
	const tag = ramp(frame, startAt + 20, 16, EASE.out);
	// Reflet lumineux unique, très discret, après l'arrivée de la carte.
	const sheen = ramp(frame, startAt + 24, 30, EASE.standard);
	const sheenOpacity = pulse(frame, startAt + 24, 30) * 0.22;

	const {Icon} = theme;
	const [from, to] = theme.gradient;

	return (
		<div
			style={{
				position: 'absolute',
				left: 0,
				top: 0,
				width: TREE.width,
				height,
				borderRadius: D.radius,
				background: `linear-gradient(135deg, ${from} 0%, ${to} 100%)`,
				boxShadow: `0 ${34 + highlight * 12}px ${70 + highlight * 30}px -26px ${withAlpha(theme.primary, 0.55 + highlight * 0.25)}, 0 4px 10px ${withAlpha(theme.deep, 0.18)}`,
				overflow: 'hidden',
				opacity,
				filter: blur > 0.05 ? `blur(${blur}px)` : undefined,
				transformOrigin: '30% 50%',
				transform: [
					`translate(${entrance.x * (1 - s)}px, ${entrance.y * (1 - s)}px)`,
					`scale(${lerp(entrance.scale, 1, s) * (1 + highlight * 0.035)})`,
					`rotate(${entrance.rotate * (1 - s)}deg)`,
				].join(' '),
			}}
		>
			{/* Icône en filigrane, avec un léger décalage de parallaxe. */}
			<Icon
				size={430}
				color="#FFFFFF"
				strokeWidth={1.4}
				style={{
					position: 'absolute',
					right: -90 + (1 - settle) * 120,
					top: height / 2 - 215,
					opacity: 0.1,
					transform: 'rotate(-10deg)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					inset: 0,
					borderRadius: D.radius,
					boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.35), inset 0 0 0 1px rgba(255,255,255,0.12)',
					background: 'linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0) 45%)',
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: -40,
					bottom: -40,
					width: 180,
					left: `${lerp(-30, 120, sheen)}%`,
					background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.9), transparent)',
					transform: 'skewX(-18deg)',
					opacity: sheenOpacity,
				}}
			/>
			<div
				style={{
					position: 'absolute',
					top: 34,
					right: 44,
					fontFamily: FONT_STACK.display,
					fontWeight: 700,
					fontSize: 22,
					letterSpacing: '0.24em',
					color: '#FFFFFF',
					opacity: tag * 0.78,
					transform: `translateY(${(1 - tag) * -10}px)`,
					textTransform: 'uppercase',
				}}
			>
				{`${DOMAIN_TAG} ${String(index + 1).padStart(2, '0')}`}
			</div>

			<div
				style={{
					position: 'absolute',
					inset: 0,
					padding: `${D.padY}px ${D.padX}px`,
					display: 'flex',
					alignItems: 'center',
					gap: D.iconGap,
				}}
			>
				<div
					style={{
						width: D.iconSize,
						height: D.iconSize,
						flexShrink: 0,
						borderRadius: '50%',
						background: 'rgba(255,255,255,0.18)',
						boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.38)',
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						transform: `scale(${Math.max(0, icon)})`,
					}}
				>
					<Icon size={70} color="#FFFFFF" strokeWidth={2} />
				</div>
				<div style={{display: 'flex', flexDirection: 'column', gap: D.codeLabelGap, minWidth: 0}}>
					<div
						style={{
							display: 'flex',
							overflow: 'hidden',
							// Marges négatives : le masque ne rogne pas les lettres, la hauteur reste celle du calcul.
							padding: '0.08em 0',
							margin: '-0.08em 0',
							fontFamily: FONT_STACK.display,
							fontWeight: D.code.weight,
							fontSize: D.code.size,
							lineHeight: D.codeLineHeight,
							letterSpacing: '-0.01em',
							color: '#FFFFFF',
						}}
					>
						{domain.code.split('').map((letter, k) => {
							const p = springAt(frame, startAt + 8 + k * 2.5, SPRINGS.text);
							return (
								<span key={`${letter}-${k}`} style={{display: 'inline-block', transform: `translateY(${(1 - p) * 105}%)`}}>
									{letter}
								</span>
							);
						})}
					</div>
					<div
						style={{
							fontFamily: FONT_STACK.text,
							fontWeight: D.label.weight,
							fontSize: D.label.size,
							lineHeight: D.labelLineHeight,
							color: 'rgba(255,255,255,0.94)',
							opacity: Math.min(1, label * 1.2),
							transform: `translateY(${(1 - label) * 18}px)`,
							textWrap: 'balance',
						}}
					>
						{domain.label}
					</div>
				</div>
			</div>
		</div>
	);
};
