import {BookOpen, Lightbulb, Microscope} from 'lucide-react';
import type {FC} from 'react';
import {AbsoluteFill, useCurrentFrame} from 'remotion';
import {ramp, revealStyle, springAt} from '../animation/progress';
import {PersonG} from '../characters/Person';
import {CAST} from '../characters/looks';
import {POSES, poseAt} from '../characters/rig';
import {BOARD} from '../config/copy';
import {VIDEO} from '../config/video';
import {Desk, DigitalBoard, Laptop} from '../illustrations/objects';
import {NAVY, withAlpha} from '../theme/colors';
import {DOMAIN_THEMES} from '../theme/domainThemes';
import {FONT_STACK} from '../theme/fonts';
import {EASE, SPRINGS} from '../theme/motion';
import {TOGETHER} from '../timeline/timeline';

const BOARD_BOX = {cx: 560, baseY: 900, width: 700, height: 400} as const;
const ICONS = [BookOpen, Microscope, Lightbulb] as const;
const ICON_COLORS = [DOMAIN_THEMES.alsh.primary, DOMAIN_THEMES.st.primary, DOMAIN_THEMES.ss.primary] as const;

/** Apparition d'un personnage par le bas, avec ressort. */
const rise = (frame: number, at: number) => springAt(frame, at, SPRINGS.card);

/**
 * Scène 08 : « Étudiants, enseignants et équipes universitaires avancent
 * ensemble dans un environnement d'apprentissage, de découverte et d'innovation. »
 */
export const TogetherScene: FC<{frame: number}> = ({frame}) => {
	const local = useCurrentFrame();
	const enter = ramp(local, 0, 12, EASE.out) * (1 - ramp(frame, TOGETHER.end - 6, 12, EASE.in));
	const cues = [TOGETHER.learnAt, TOGETHER.discoverAt, TOGETHER.innovateAt];

	const teacherPose = poseAt(frame, [
		{at: TOGETHER.from, pose: POSES.present},
		{at: TOGETHER.learnAt, pose: {...POSES.present, frontArm: {shoulder: 120, elbow: 8}}, blend: 10},
		{at: TOGETHER.innovateAt + 10, pose: {...POSES.present, frontArm: {shoulder: 70, elbow: 40}, lookX: -0.4}, blend: 14},
	]);
	const studentAPose = poseAt(frame, [
		{at: TOGETHER.from, pose: {...POSES.lookUp, headTilt: -4}},
		{at: TOGETHER.discoverAt + 2, pose: POSES.raiseHand, blend: 10},
		{at: TOGETHER.innovateAt + 16, pose: {...POSES.lookUp, smile: 0.9}, blend: 12},
	]);
	const people = [
		{look: CAST.studentA, x: 640, y: 1268, s: 0.74, at: TOGETHER.studentsAt, pose: studentAPose, facing: -1 as const, seed: 11},
		{look: CAST.studentB, x: 820, y: 1276, s: 0.72, at: TOGETHER.studentsAt + 5, pose: {...POSES.lookUp, headTilt: -2, smile: 0.6}, facing: -1 as const, seed: 12},
		{look: CAST.staff, x: 980, y: 1180, s: 0.72, at: TOGETHER.staffAt, pose: {...POSES.hold, lookY: 0.2, headTilt: 2}, facing: -1 as const, seed: 13},
	];
	const teacherIn = rise(frame, TOGETHER.teacherAt - 4);

	return (
		<AbsoluteFill style={{opacity: enter}}>
			<svg width={VIDEO.width} height={VIDEO.height} viewBox={`0 0 ${VIDEO.width} ${VIDEO.height}`} style={{position: 'absolute', inset: 0, overflow: 'visible'}}>
				<circle cx={560} cy={700} r={460} fill={withAlpha('#FFFFFF', 0.7)} />
				<DigitalBoard x={BOARD_BOX.cx} y={BOARD_BOX.baseY} color={NAVY.base} width={BOARD_BOX.width} height={BOARD_BOX.height} />

				{/* Enseignant, tourné vers le tableau et la classe */}
				<g transform={`translate(${190} ${1240 + (1 - teacherIn) * 300}) scale(0.86)`} opacity={Math.min(1, teacherIn * 1.5)}>
					<PersonG look={CAST.teacher} pose={teacherPose} frame={frame} seed={10} facing={1} />
				</g>

				{/* Membre de l'équipe universitaire et étudiants, derrière la table */}
				{people.map((p) => {
					const r = rise(frame, p.at);
					return r > 0 ? (
						<g key={p.seed} transform={`translate(${p.x} ${p.y + (1 - r) * 260}) scale(${p.s})`} opacity={Math.min(1, r * 1.5)}>
							<PersonG look={p.look} pose={p.pose} frame={frame} seed={p.seed} facing={p.facing} held={p.look === CAST.staff ? 'tablet' : 'none'} heldColor={DOMAIN_THEMES.alsh.primary} />
						</g>
					) : null;
				})}
				<Desk x={760} y={1300} color="#D9C3A0" width={520} />
				<Laptop x={700} y={1110} s={0.9} color={DOMAIN_THEMES.si.primary} />
			</svg>

			{/* Contenu du tableau numérique */}
			<div
				style={{
					position: 'absolute',
					left: BOARD_BOX.cx - BOARD_BOX.width / 2,
					top: BOARD_BOX.baseY - 90 - BOARD_BOX.height,
					width: BOARD_BOX.width,
					height: BOARD_BOX.height,
					padding: '40px 46px',
					display: 'flex',
					flexDirection: 'column',
					gap: 34,
				}}
			>
				<div
					style={{
						fontFamily: FONT_STACK.display,
						fontWeight: 800,
						fontSize: 40,
						lineHeight: 1.1,
						color: '#FFFFFF',
						textWrap: 'balance',
						...revealStyle(springAt(frame, TOGETHER.teacherAt + 4, SPRINGS.text), {x: -20}, 6),
					}}
				>
					{BOARD.title}
				</div>
				<div style={{display: 'flex', gap: 22}}>
					{BOARD.items.map((item, i) => {
						const Icon = ICONS[i] ?? BookOpen;
						const p = springAt(frame, (cues[i] ?? TOGETHER.learnAt) - 2, SPRINGS.pop);
						return (
							<div
								key={item}
								style={{
									flex: 1,
									height: 190,
									borderRadius: 24,
									background: 'rgba(255,255,255,0.1)',
									boxShadow: 'inset 0 0 0 2px rgba(255,255,255,0.14)',
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
									justifyContent: 'center',
									gap: 16,
									opacity: Math.min(1, Math.max(0, p) * 1.5),
									scale: `${0.7 + 0.3 * Math.min(1.05, Math.max(0, p))}`,
								}}
							>
								<div
									style={{
										width: 86,
										height: 86,
										borderRadius: '50%',
										background: ICON_COLORS[i],
										display: 'flex',
										alignItems: 'center',
										justifyContent: 'center',
									}}
								>
									<Icon size={46} color="#FFFFFF" strokeWidth={2} />
								</div>
								<div style={{fontFamily: FONT_STACK.text, fontWeight: 600, fontSize: 26, color: '#FFFFFF'}}>{item}</div>
							</div>
						);
					})}
				</div>
			</div>
		</AbsoluteFill>
	);
};
