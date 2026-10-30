import {getPointAtLength, getLength} from '@remotion/paths';
import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ramp, revealStyle, springAt} from '../animation/progress';
import {AnimatedConnector} from '../components/AnimatedConnector';
import {Person, PersonG} from '../characters/Person';
import type {Look} from '../characters/looks';
import {CAST} from '../characters/looks';
import {POSES, poseAt} from '../characters/rig';
import {FUTURE_FIELDS} from '../config/copy';
import {VIDEO} from '../config/video';
import type {DomainId} from '../data/academicStructure';
import {ACADEMIC_STRUCTURE} from '../data/academicStructure';
import {INK, withAlpha} from '../theme/colors';
import {DOMAIN_THEMES} from '../theme/domainThemes';
import {FONT_STACK} from '../theme/fonts';
import {EASE, SPRINGS} from '../theme/motion';
import {FUTURES} from '../timeline/timeline';

const STUDENT = {x: 540, feetY: 1270, scale: 0.84} as const;
const ORIGIN = {x: 548, y: 796} as const;
const R = 80;
const SLOTS: readonly {x: number; y: number}[] = [
	{x: 186, y: 560},
	{x: 398, y: 430},
	{x: 650, y: 430},
	{x: 846, y: 560},
];
/** Largeur des intitulés : le plus à droite reste dans la zone sûre. */
const LABEL_WIDTH = 184;
const PROFESSIONALS: Record<DomainId, Look> = {
	alsh: CAST.proResearch,
	st: CAST.proEnvironment,
	ss: CAST.proLaw,
	si: CAST.proEngineer,
};

const pathTo = (slot: {x: number; y: number}) =>
	`M ${ORIGIN.x} ${ORIGIN.y} C ${ORIGIN.x} ${ORIGIN.y - 140} ${slot.x} ${slot.y + R + 140} ${slot.x} ${slot.y + R}`;

/** Portrait en buste d'un professionnel, découpé dans un médaillon. */
const Portrait: FC<{look: Look; frame: number; seed: number; id: string; tint: string}> = ({look, frame, seed, id, tint}) => (
	<svg width={R * 2} height={R * 2} viewBox="-100 -640 220 220" style={{display: 'block'}}>
		<defs>
			<clipPath id={id}>
				<circle cx={10} cy={-530} r={110} />
			</clipPath>
		</defs>
		<circle cx={10} cy={-530} r={110} fill={tint} />
		<g clipPath={`url(#${id})`}>
			<PersonG look={look} pose={{...POSES.stand, smile: 0.8}} frame={frame} seed={seed} shadow={false} />
		</g>
	</svg>
);

/**
 * Scène 07 : « …conçus pour accompagner votre projet d'études et votre
 * orientation professionnelle ». Des chemins partent de l'étudiante vers
 * quatre avenirs symboliques, un par domaine.
 */
export const FuturesScene: FC<{frame: number}> = ({frame}) => {
	const local = useCurrentFrame();
	const enter = ramp(local, 0, 14, EASE.out) * (1 - ramp(frame, FUTURES.end - 8, 12, EASE.in));
	const pose = poseAt(frame, [
		{at: FUTURES.from, pose: POSES.lookUp},
		{at: FUTURES.careersAt + 6, pose: {...POSES.point, frontArm: {shoulder: 140, elbow: 12}}, blend: 14},
	]);

	return (
		<AbsoluteFill style={{opacity: enter}}>
			<svg width={VIDEO.width} height={VIDEO.height} style={{position: 'absolute', inset: 0}}>
				{ACADEMIC_STRUCTURE.map((domain, i) => {
					const slot = SLOTS[i];
					if (!slot) {
						return null;
					}
					const path = pathTo(slot);
					const theme = DOMAIN_THEMES[domain.id];
					const draw = ramp(frame, FUTURES.from + 4 + i * 3, 22, EASE.draw);
					// Impulsions lumineuses : l'accompagnement circule le long des chemins.
					const length = getLength(path);
					const pulses = [0, 0.5].map((offset) => {
						const t = ((frame - FUTURES.projectAt) / 34 + offset) % 1;
						return frame >= FUTURES.projectAt && t >= 0 ? getPointAtLength(path, length * t) : null;
					});
					return (
						<g key={domain.id}>
							<AnimatedConnector path={path} progress={draw} color={theme.line} width={7} />
							{pulses.map((p, k) =>
								p ? <circle key={k} cx={p.x} cy={p.y} r={9} fill={theme.primary} opacity={0.85} /> : null,
							)}
						</g>
					);
				})}
			</svg>

			{ACADEMIC_STRUCTURE.map((domain, i) => {
				const slot = SLOTS[i];
				if (!slot) {
					return null;
				}
				const theme = DOMAIN_THEMES[domain.id];
				const {Icon} = theme;
				const pop = springAt(frame, FUTURES.from + 14 + i * 4, SPRINGS.pop);
				// Retournement du médaillon : du domaine vers un avenir professionnel.
				const flip = ramp(frame, FUTURES.careersAt + i * 5, 14, EASE.standard);
				const faceScale = Math.abs(Math.cos(flip * Math.PI));
				const showPortrait = flip > 0.5;
				const label = springAt(frame, FUTURES.careersAt + 8 + i * 5, SPRINGS.reveal);
				const [line1, line2] = FUTURE_FIELDS[domain.id];
				return (
					<div key={domain.id}>
						<div
							style={{
								position: 'absolute',
								left: slot.x - R,
								top: slot.y - R + Math.sin((frame + i * 17) / 22) * 4,
								width: R * 2,
								height: R * 2,
								borderRadius: '50%',
								overflow: 'hidden',
								background: `linear-gradient(135deg, ${theme.gradient[0]}, ${theme.gradient[1]})`,
								boxShadow: `0 0 0 6px #FFFFFF, 0 20px 40px -16px ${withAlpha(theme.primary, 0.65)}`,
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
								scale: `${Math.max(0, pop) * Math.max(0.02, faceScale)} ${Math.max(0, pop)}`,
							}}
						>
							{showPortrait ? (
								<Portrait look={PROFESSIONALS[domain.id]} frame={frame} seed={i + 5} id={`future-${domain.id}`} tint={theme.soft} />
							) : (
								<div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2}}>
									<Icon size={46} color="#FFFFFF" strokeWidth={2} />
									<div style={{fontFamily: FONT_STACK.display, fontWeight: 800, fontSize: 30, color: '#FFFFFF'}}>{domain.code}</div>
								</div>
							)}
						</div>
						{label > 0 ? (
							<div
								style={{
									position: 'absolute',
									left: slot.x - LABEL_WIDTH / 2,
									width: LABEL_WIDTH,
									top: slot.y - R - 78,
									textAlign: 'center',
									fontFamily: FONT_STACK.display,
									fontWeight: 700,
									fontSize: 26,
									lineHeight: 1.2,
									color: INK.strong,
									...revealStyle(label, {y: 12}, 6),
								}}
							>
								<div style={{color: theme.deep}}>{line1}</div>
								<div>{line2}</div>
							</div>
						) : null}
					</div>
				);
			})}

			<Person look={CAST.mainStudent} pose={pose} frame={frame} seed={3} x={STUDENT.x} y={STUDENT.feetY} scale={STUDENT.scale} />
		</AbsoluteFill>
	);
};
