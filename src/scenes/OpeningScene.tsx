import type {FC} from 'react';
import {AbsoluteFill, interpolate, useCurrentFrame} from 'remotion';
import {ramp, revealStyle, springAt} from '../animation/progress';
import {AnimatedConnector} from '../components/AnimatedConnector';
import {InstitutionBanner} from '../components/InstitutionBanner';
import {KineticHeadline} from '../components/KineticHeadline';
import {Person} from '../characters/Person';
import {CAST} from '../characters/looks';
import {POSES, poseAt, walkPose} from '../characters/rig';
import {VIDEO} from '../config/video';
import {ACADEMIC_STRUCTURE, getStructureStats} from '../data/academicStructure';
import type {Rect} from '../layout/geometry';
import {lerp} from '../layout/geometry';
import {INK, NAVY, PAPER, SHADOW, withAlpha} from '../theme/colors';
import {DOMAIN_THEMES} from '../theme/domainThemes';
import {FONT_STACK} from '../theme/fonts';
import {LOCKUP} from '../theme/lockup';
import {EASE, SPRINGS} from '../theme/motion';
import {GATEWAY, HOOK} from '../timeline/timeline';

const BANNER_RECT: Rect = {x: 44, y: 196, width: VIDEO.width - 88, height: 250};
const STUDENT = {x: 540, feetY: 1300, scale: 0.98} as const;
const MEDALLION = {y: 612, r: 74, xs: [180, 400, 620, 840]} as const;
/** Point de convergence des liens, au-dessus de la tête de l'étudiante. */
const STUDENT_FOCUS = {x: 556, y: 716} as const;
const stats = getStructureStats();
const STATS_TOP = 462;

/** Accroche « Nouveaux bacheliers ? », mot clé souligné. */
const HEADLINE = [
	[{text: 'Nouveaux', color: INK.strong}],
	[
		{text: 'bacheliers', color: NAVY.bright, underline: '#FFC145'},
		{text: '?', color: '#F0A01A'},
	],
] as const;

const QUESTIONS = [
	{text: 'Quel parcours pour mon avenir ?', at: HOOK.bubbleAvenirAt, rect: {x: 84, y: 470, w: 400}, tail: 'right'},
	{text: 'Quelle formation choisir ?', at: HOOK.bubbleFormationAt, rect: {x: 500, y: 548, w: 440}, tail: 'left'},
] as const;

/** Bulle de question (pensée de l'étudiante). */
const QuestionBubble: FC<{text: string; x: number; y: number; w: number; tail: 'left' | 'right'; progress: number; out: number; float: number}> = ({
	text,
	x,
	y,
	w,
	tail,
	progress,
	out,
	float,
}) => (
	<div
		style={{
			position: 'absolute',
			left: x,
			top: y + float,
			width: w,
			padding: '26px 30px',
			borderRadius: 34,
			background: PAPER.card,
			boxShadow: SHADOW.card,
			fontFamily: FONT_STACK.display,
			fontWeight: 700,
			fontSize: 38,
			lineHeight: 1.18,
			color: INK.strong,
			textWrap: 'balance',
			transformOrigin: tail === 'right' ? '85% 100%' : '15% 100%',
			...revealStyle(progress, {y: 30}, 8),
			opacity: Math.min(1, progress * 1.4) * (1 - out),
			scale: `${lerp(0.86, 1, Math.min(1, progress)) * (1 - out * 0.12)}`,
		}}
	>
		{/* Espace insécable avant « ? » (typographie française) : le point d'interrogation ne passe jamais seul à la ligne. */}
		<span style={{color: NAVY.bright}}>{text.slice(0, -2)}</span>
		<span style={{color: '#F0A01A', whiteSpace: 'nowrap'}}>{'\u00A0?'}</span>
		<div
			style={{
				position: 'absolute',
				bottom: -16,
				[tail === 'right' ? 'right' : 'left']: 46,
				width: 34,
				height: 34,
				background: PAPER.card,
				borderRadius: 6,
				transform: 'rotate(45deg)',
			}}
		/>
	</div>
);

/**
 * Scènes 01-02 : une étudiante s'interroge sur son avenir ; l'Université
 * d'Androna apparaît comme réponse et ses quatre domaines s'ouvrent autour d'elle.
 */
export const OpeningScene: FC = () => {
	const frame = useCurrentFrame();
	const exit = ramp(frame, GATEWAY.exitAt, GATEWAY.exitDuration, EASE.in);

	// Entrée en marchant, puis réflexion, puis regard vers l'université.
	const walk = ramp(frame, 0, HOOK.walkDuration, EASE.out);
	const walking = frame < HOOK.walkDuration + 4;
	const pose = walking
		? walkPose(frame / 26)
		: poseAt(frame, [
				{at: HOOK.walkDuration + 4, pose: POSES.stand, blend: 8},
				{at: HOOK.bubbleFormationAt + 6, pose: POSES.think, blend: 14},
				{at: HOOK.gatewayAt + 10, pose: POSES.lookUp, blend: 14},
				{at: GATEWAY.domainsAt + 8, pose: {...POSES.point, frontArm: {shoulder: 150, elbow: 10}}, blend: 14},
				{at: GATEWAY.programsAt + 6, pose: {...POSES.lookUp, smile: 0.9}, blend: 16},
			]);

	const gateway = springAt(frame, HOOK.gatewayAt, SPRINGS.card);
	const questionsOut = ramp(frame, HOOK.gatewayAt - 6, 14, EASE.in);
	const statTimes = [GATEWAY.domainsAt, GATEWAY.mentionsAt, GATEWAY.programsAt] as const;

	return (
		<AbsoluteFill style={{opacity: 1 - exit, filter: exit > 0.01 ? `blur(${exit * 10}px)` : undefined}}>
			{/* Démarré avant l'image 0 : la première image (vignette du Reel) montre déjà l'accroche. */}
			<KineticHeadline frame={frame} lines={HEADLINE} at={HOOK.headlineAt - 12} exitAt={HOOK.gatewayAt - 12} top={262} fontSize={92} />

			{/* Halo derrière l'étudiante */}
			<div
				style={{
					position: 'absolute',
					left: STUDENT.x - 380,
					top: 760,
					width: 760,
					height: 760,
					borderRadius: '50%',
					background: `radial-gradient(circle, ${withAlpha('#FFFFFF', 0.95)} 0%, ${withAlpha('#DCE9FB', 0.6)} 45%, transparent 70%)`,
					opacity: ramp(frame, -14, 30, EASE.out),
				}}
			/>

			{/* Université : la réponse */}
			{gateway > 0 ? (
				<div
					style={{
						position: 'absolute',
						inset: 0,
						opacity: Math.min(1, gateway * 1.6),
						transformOrigin: `${STUDENT_FOCUS.x}px 500px`,
						scale: `${lerp(0.82, 1, Math.min(1, gateway))}`,
						translate: `0 ${(1 - gateway) * 60}px`,
					}}
				>
					<InstitutionBanner
						rect={BANNER_RECT}
						radius={56}
						scale={0.5}
						metrics={LOCKUP.header}
						contentCenter={{x: VIDEO.width / 2, y: BANNER_RECT.y + BANNER_RECT.height / 2}}
						lineProgress={[springAt(frame, HOOK.gatewayAt + 4, SPRINGS.text), springAt(frame, HOOK.gatewayAt + 9, SPRINGS.text)]}
						subtitleProgress={springAt(frame, HOOK.gatewayAt + 14, SPRINGS.text)}
						accentProgress={springAt(frame, HOOK.gatewayAt + 18, SPRINGS.text)}
						iconOpacity={ramp(frame, HOOK.gatewayAt + 10, 14, EASE.out)}
					/>
				</div>
			) : null}

			{/* Effectifs, calculés depuis les données : chaque chiffre claque sur son mot. */}
			<div style={{position: 'absolute', left: 0, width: VIDEO.width, top: STATS_TOP, display: 'flex', justifyContent: 'center', gap: 14}}>
				{[
					[stats.domains, 'domaines'],
					[stats.mentions, 'mentions'],
					[stats.programs, 'parcours'],
				].map(([n, label], i) => {
					const at = statTimes[i] ?? 0;
					const pop = springAt(frame, at - 2, SPRINGS.pop);
					if (pop <= 0) {
						return null;
					}
					// Compteur rapide jusqu'à la valeur réelle.
					const count = Math.round(Number(n) * ramp(frame, at - 2, 10, EASE.out));
					return (
						<div
							key={label}
							style={{
								display: 'flex',
								alignItems: 'baseline',
								gap: 10,
								padding: '10px 24px 12px',
								borderRadius: 999,
								background: `linear-gradient(135deg, ${NAVY.bright}, ${NAVY.base})`,
								boxShadow: `0 16px 30px -14px ${withAlpha(NAVY.base, 0.8)}`,
								fontFamily: FONT_STACK.text,
								fontWeight: 600,
								fontSize: 30,
								color: '#FFFFFF',
								opacity: Math.min(1, pop * 2),
								scale: `${0.4 + 0.6 * pop}`,
								rotate: `${(1 - Math.min(1, pop)) * (i - 1) * 8}deg`,
							}}
						>
							<span style={{fontFamily: FONT_STACK.display, fontWeight: 900, fontSize: 40, color: '#FFC145', minWidth: label === 'domaines' ? 26 : 50, textAlign: 'right'}}>{count}</span>
							{label}
						</div>
					);
				})}
			</div>

			{/* Liens des domaines vers l'étudiante */}
			<svg width={VIDEO.width} height={VIDEO.height} style={{position: 'absolute', inset: 0}}>
				{ACADEMIC_STRUCTURE.map((domain, i) => {
					const x = MEDALLION.xs[i] ?? 0;
					const path = `M ${x} ${MEDALLION.y + MEDALLION.r} C ${x} ${MEDALLION.y + 150} ${STUDENT_FOCUS.x} ${STUDENT_FOCUS.y - 90} ${STUDENT_FOCUS.x} ${STUDENT_FOCUS.y}`;
					return (
						<AnimatedConnector
							key={domain.id}
							path={path}
							progress={ramp(frame, GATEWAY.domainsAt + 10 + i * 3, 18, EASE.draw)}
							color={DOMAIN_THEMES[domain.id].line}
							width={5}
						/>
					);
				})}
			</svg>

			{/* Les quatre domaines s'ouvrent autour de l'étudiante */}
			{ACADEMIC_STRUCTURE.map((domain, i) => {
				const theme = DOMAIN_THEMES[domain.id];
				const pop = springAt(frame, GATEWAY.domainsAt + i * 5, SPRINGS.pop);
				if (pop <= 0) {
					return null;
				}
				const x = MEDALLION.xs[i] ?? 0;
				const {Icon} = theme;
				const float = Math.sin((frame + i * 19) / 20) * 4;
				return (
					<div
						key={domain.id}
						style={{
							position: 'absolute',
							left: x - MEDALLION.r,
							top: MEDALLION.y - MEDALLION.r + float,
							width: MEDALLION.r * 2,
							height: MEDALLION.r * 2,
							borderRadius: '50%',
							background: `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
							boxShadow: `0 18px 36px -14px ${withAlpha(theme.primary, 0.6)}`,
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							justifyContent: 'center',
							gap: 4,
							scale: `${Math.max(0, pop)}`,
							translate: `${(STUDENT_FOCUS.x - x) * (1 - Math.min(1, pop)) * 0.6}px ${(STUDENT_FOCUS.y - MEDALLION.y) * (1 - Math.min(1, pop)) * 0.6}px`,
						}}
					>
						<Icon size={44} color="#FFFFFF" strokeWidth={2} />
						<div style={{fontFamily: FONT_STACK.display, fontWeight: 800, fontSize: 30, color: '#FFFFFF', letterSpacing: '0.02em'}}>{domain.code}</div>
					</div>
				);
			})}

			{/* Questions */}
			{QUESTIONS.map((q, i) => {
				const p = springAt(frame, q.at, SPRINGS.reveal);
				return p > 0 && questionsOut < 1 ? (
					<QuestionBubble
						key={q.text}
						text={q.text}
						x={q.rect.x}
						y={q.rect.y}
						w={q.rect.w}
						tail={q.tail}
						progress={p}
						out={questionsOut}
						float={Math.sin((frame + i * 30) / 24) * 5}
					/>
				) : null;
			})}

			<Person
				look={CAST.mainStudent}
				pose={pose}
				frame={frame}
				seed={3}
				x={interpolate(walk, [0, 1], [120, STUDENT.x])}
				y={STUDENT.feetY}
				scale={STUDENT.scale}
			/>
		</AbsoluteFill>
	);
};
