import {ArrowRight} from 'lucide-react';
import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {pulse, ramp, revealStyle, springAt} from '../animation/progress';
import {InstitutionBanner} from '../components/InstitutionBanner';
import {SpectrumLine} from '../components/SpectrumLine';
import {CALL_TO_ACTION, VIDEO_TAGLINE} from '../config/copy';
import {VIDEO} from '../config/video';
import type {Rect} from '../layout/geometry';
import {lerp, lerpRect} from '../layout/geometry';
import {WORLD} from '../layout/worldLayout';
import {NAVY} from '../theme/colors';
import {FONT_STACK} from '../theme/fonts';
import {LOCKUP, mixLockup, scaleLockup} from '../theme/lockup';
import {EASE, SPRINGS} from '../theme/motion';
import {OUTRO} from '../timeline/timeline';

const FULL: Rect = {x: 0, y: 0, width: VIDEO.width, height: VIDEO.height};
const TITLE_CENTER = {x: VIDEO.width / 2, y: 700};
const SPECTRUM = {width: 300, top: 818};
const CTA_TOP = 900;
const HOOK_TOP = 1040;
/** Point cliqué sur le bouton (fin du texte, avant la flèche). */
const CLICK = {x: 690, y: 962} as const;
const CURSOR_FROM = {x: 1000, y: 1260} as const;

/** Curseur de souris : il rejoint le bouton, clique (onde), puis s'efface. */
const ClickCursor: FC<{frame: number; at: number}> = ({frame, at}) => {
	const move = ramp(frame, at - 18, 16, EASE.out);
	const fade = ramp(frame, at + 26, 10, EASE.in);
	if (frame < at - 18 || fade >= 1) {
		return null;
	}
	const press = pulse(frame, at, 8);
	const ripple = ramp(frame, at, 18, EASE.out);
	return (
		<>
			{frame >= at ? (
				<div
					style={{
						position: 'absolute',
						left: CLICK.x - 120,
						top: CLICK.y - 120,
						width: 240,
						height: 240,
						borderRadius: '50%',
						border: '6px solid rgba(255, 193, 69, 0.9)',
						scale: `${0.1 + 0.9 * ripple}`,
						opacity: 0.8 * (1 - ripple),
					}}
				/>
			) : null}
			<svg
				width={56}
				height={70}
				viewBox="0 0 28 35"
				style={{
					position: 'absolute',
					left: lerp(CURSOR_FROM.x, CLICK.x, move),
					top: lerp(CURSOR_FROM.y, CLICK.y, move),
					transformOrigin: '0 0',
					scale: `${1 - 0.18 * press}`,
					opacity: Math.min(1, move * 3) * (1 - fade),
					filter: 'drop-shadow(0 6px 10px rgba(0, 10, 40, 0.45))',
				}}
			>
				<path d="M 1 1 L 1 26 L 7.5 20 L 12 31 L 17 29 L 12.6 18.6 L 21 18.6 Z" fill="#FFFFFF" stroke="#0D1B36" strokeWidth={1.8} strokeLinejoin="round" />
			</svg>
		</>
	);
};

interface OutroSceneProps {
	/** Position à l'écran du bandeau racine au moment de la reprise. */
	readonly rootScreen: Rect;
	readonly zoom: number;
}

/**
 * Carte de fin : le bandeau racine s'ouvre en plein écran, « Université
 * d'Androna » reste seul, puis l'appel à l'action et l'accroche de campagne.
 */
export const OutroScene: FC<OutroSceneProps> = ({rootScreen, zoom}) => {
	const frame = useCurrentFrame();
	const open = ramp(frame, 0, OUTRO.panelDuration, EASE.camera);
	const title = ramp(frame, OUTRO.titleAt, OUTRO.titleDuration, EASE.standard);
	const fadeDetails = 1 - ramp(frame, 0, 14, EASE.out);
	const rootCenter = {x: rootScreen.x + rootScreen.width / 2, y: rootScreen.y + rootScreen.height / 2};
	const cta = springAt(frame, OUTRO.ctaAt, SPRINGS.card);
	const hook = springAt(frame, OUTRO.hookAt, SPRINGS.text);
	// Reflet lent qui traverse le bouton une fois posé.
	const sheen = ramp(frame, OUTRO.ctaAt + 16, 34, EASE.standard);
	// Le bouton s'enfonce légèrement sous le clic.
	const pressed = 1 - 0.05 * pulse(frame, OUTRO.clickAt, 8);

	return (
		<AbsoluteFill>
			<InstitutionBanner
				rect={lerpRect(rootScreen, FULL, open)}
				radius={lerp(WORLD.root.radius * zoom, 0, open)}
				scale={lerp(zoom, 1, title)}
				metrics={mixLockup(scaleLockup(LOCKUP.root, zoom), LOCKUP.hero, title)}
				contentCenter={{x: lerp(rootCenter.x, TITLE_CENTER.x, title), y: lerp(rootCenter.y, TITLE_CENTER.y, title)}}
				lineProgress={[1, 1]}
				subtitleProgress={1}
				subtitleOpacity={fadeDetails}
				accentProgress={fadeDetails}
				iconOpacity={fadeDetails}
				shadow={1 - open}
			/>
			<SpectrumLine
				width={SPECTRUM.width}
				progress={springAt(frame, OUTRO.spectrumAt, SPRINGS.text)}
				style={{position: 'absolute', left: (VIDEO.width - SPECTRUM.width) / 2, top: SPECTRUM.top}}
			/>

			{/* Appel à l'action (aucune coordonnée inventée) */}
			{cta > 0 ? (
				<div style={{position: 'absolute', left: 0, width: VIDEO.width, top: CTA_TOP, display: 'flex', justifyContent: 'center'}}>
					<div
						style={{
							position: 'relative',
							overflow: 'hidden',
							display: 'flex',
							alignItems: 'center',
							gap: 18,
							padding: '26px 44px',
							borderRadius: 999,
							background: '#FFFFFF',
							boxShadow: '0 22px 50px -18px rgba(0, 10, 40, 0.6)',
							fontFamily: FONT_STACK.display,
							fontWeight: 800,
							fontSize: 42,
							color: NAVY.base,
							...revealStyle(cta, {y: 30}, 8),
							scale: `${(0.9 + 0.1 * Math.min(1, cta)) * pressed}`,
						}}
					>
						{CALL_TO_ACTION}
						<ArrowRight size={44} color={NAVY.bright} strokeWidth={2.6} style={{translate: `${Math.sin(frame / 9) * 4}px 0`}} />
						<div
							style={{
								position: 'absolute',
								top: -20,
								bottom: -20,
								width: 120,
								left: `${lerp(-30, 120, sheen)}%`,
								background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)',
								transform: 'skewX(-18deg)',
								opacity: Math.sin(sheen * Math.PI) * 0.6,
							}}
						/>
					</div>
				</div>
			) : null}

			<ClickCursor frame={frame} at={OUTRO.clickAt} />

			{/* Accroche de campagne : ce n'est pas un slogan officiel de l'université. */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					width: VIDEO.width,
					top: HOOK_TOP,
					textAlign: 'center',
					fontFamily: FONT_STACK.text,
					fontWeight: 500,
					fontSize: 34,
					color: 'rgba(255,255,255,0.78)',
					...revealStyle(hook, {y: 16}, 6),
				}}
			>
				{VIDEO_TAGLINE.join(' ')}
			</div>
		</AbsoluteFill>
	);
};
