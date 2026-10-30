import type {FC} from 'react';
import {AbsoluteFill} from 'remotion';
import {ramp, springAt} from '../animation/progress';
import {Person} from '../characters/Person';
import type {Look} from '../characters/looks';
import {CAST} from '../characters/looks';
import type {Pose} from '../characters/rig';
import {POSES, poseAt} from '../characters/rig';
import {lerp} from '../layout/geometry';
import {EASE, SPRINGS} from '../theme/motion';
import {FINAL, OUTRO} from '../timeline/timeline';

interface Member {
	readonly look: Look;
	readonly x: number;
	readonly scale: number;
	readonly delay: number;
	readonly facing: 1 | -1;
	readonly pose: Pose;
}

/** Étudiants au premier plan, tournés vers la structure (têtes au-dessus des sous-titres). */
const CROWD: readonly Member[] = [
	{look: CAST.studentB, x: 132, scale: 0.7, delay: 6, facing: 1, pose: {...POSES.lookUp, smile: 0.8}},
	{look: CAST.studentA, x: 318, scale: 0.72, delay: 2, facing: 1, pose: {...POSES.lookUp, headTilt: -10}},
	{look: CAST.studentC, x: 786, scale: 0.72, delay: 4, facing: -1, pose: {...POSES.lookUp, smile: 0.7}},
	{look: CAST.studentD, x: 960, scale: 0.7, delay: 8, facing: -1, pose: {...POSES.lookUp, headTilt: -12}},
];
const CROWD_FEET = 1660;
const MAIN = {x: 556, feet: 1690, scale: 0.78, graduateScale: 0.86} as const;

/**
 * Révélation finale : des étudiants apparaissent autour de la structure ;
 * l'étudiante principale désigne un parcours puis devient diplômée.
 */
export const FinalCrowd: FC<{frame: number}> = ({frame}) => {
	const crowdAt = FINAL.chooseAt - 22;
	const leave = ramp(frame, OUTRO.from, 16, EASE.in);
	const graduate = ramp(frame, FINAL.buildAt, 10, EASE.standard);
	const isGraduate = graduate >= 0.5;
	const mainRise = springAt(frame, crowdAt, SPRINGS.card);
	const burst = ramp(frame, FINAL.buildAt + 4, 16, EASE.out);

	const mainPose = poseAt(frame, [
		{at: crowdAt, pose: POSES.lookUp},
		{at: FINAL.chooseAt + 4, pose: {...POSES.point, frontArm: {shoulder: 150, elbow: 8}}, blend: 10},
		{at: FINAL.buildAt + 8, pose: POSES.cheer, blend: 10},
	]);

	return (
		<AbsoluteFill style={{opacity: 1 - leave, translate: `0 ${leave * 120}px`}}>
			{CROWD.map((m, i) => {
				const r = springAt(frame, crowdAt + m.delay, SPRINGS.card);
				return r > 0 ? (
					<Person
						key={i}
						look={m.look}
						pose={m.pose}
						frame={frame}
						seed={20 + i}
						facing={m.facing}
						x={m.x}
						y={CROWD_FEET + (1 - r) * 420}
						scale={m.scale}
						shadow={false}
					/>
				) : null;
			})}

			{/* Éclat discret au moment du diplôme */}
			{burst > 0 && burst < 1 ? (
				<div
					style={{
						position: 'absolute',
						left: MAIN.x - 220,
						top: 1010,
						width: 440,
						height: 440,
						borderRadius: '50%',
						border: '6px solid rgba(240, 160, 26, 0.7)',
						opacity: 1 - burst,
						scale: `${0.4 + burst * 0.9}`,
					}}
				/>
			) : null}

			{mainRise > 0 ? (
				<Person
					look={isGraduate ? CAST.graduate : CAST.mainStudent}
					pose={mainPose}
					frame={frame}
					seed={3}
					x={MAIN.x}
					// La diplômée s'avance légèrement vers le premier plan.
					y={MAIN.feet + (1 - mainRise) * 460 + graduate * 30}
					scale={lerp(MAIN.scale, MAIN.graduateScale, graduate) * (isGraduate ? 1 : 1 - Math.sin(graduate * Math.PI) * 0.04)}
					shadow={false}
				/>
			) : null}
		</AbsoluteFill>
	);
};
